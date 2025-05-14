import { userModel } from '~/models/userModel'
import { pickUser } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { INVITATION_TYPES, BOARD_INVITATION_STATUS } from '~/utils/constants'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createNewBoardInvitation = async (reqBody, inviterId) => {
  try {
    //Nguoi di moi: la nguoi dang request
    const inviter = await userModel.findOneById(inviterId)

    //Nguoi duoc moi: Lấy theo email nhan tu phía FE
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)

    //board: nguoi moi di moi
    const board = await boardModel.findOneById(reqBody.boardId)

    if (!invitee || !inviter || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, Invitee or Board not found!')
    }

    //create data necessary to save in DB
    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(), // toSting vì sang bên model check lại
      type: INVITATION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING,
      },
    }

    // call model to save
    const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId)

    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee),
    }

    return resInvitation
  } catch (error) {
    throw error
  }
}

const getInvitations = async (userId) => {
  try {
    const getInvitations = await invitationModel.findByUser(userId)

    // Vi du lieu inviter, invitee, board tra ve 1 mang chi cho 1 phan tu object
    // nen bien doi no ve 1 object trc khi tra ve FE
    const resInvitations = getInvitations.map((invitation) => ({
      ...invitation,
      inviter: invitation.inviter[0] || {},
      invitee: invitation.invitee[0] || {},
      board: invitation.board[0] || {},
    }))

    return resInvitations
  } catch (error) {
    throw error
  }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // check user da la owner or member cua board, neu r tra ve loi
    // convert objectId ve string  to check
    const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board!')
    }

    //tao du lieu de update
    const updateData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status: status,
      },
      updatedAt: Date.now(),
    }

    // B1: update status in invitation
    const updatedInvitation = await invitationModel.update(invitationId, updateData)

    //B2: Neu case Accept 1 loi moi thanh cong, thi can phai them thong tin cua user(userId) vao ban ghi memberIds trong collection board
    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
    }

    return updatedInvitation
  } catch (error) {
    throw error
  }
}

export const invitationService = { createNewBoardInvitation, getInvitations, updateBoardInvitation }
