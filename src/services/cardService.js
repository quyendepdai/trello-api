import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody,
    }

    const createdCard = await cardModel.createNew(newCard)

    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    // update array cardOrderIds trong columns
    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }

    return getNewCard
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile, userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    }

    let updatedCard = {}

    if (cardCoverFile) {
      // case: upload card cover -> cloudinary
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-cover')

      // Luu lai url cua file anh vao trong DB
      updatedCard = await cardModel.update(cardId, {
        cover: uploadResult.secure_url,
      })
    } else if (updateData.commentToAdd) {
      // case: update card comment
      // bo sung them fields can thiet
      const commentData = {
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email,
      }

      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      //case add or remove member out of card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else {
      // các trường hợp update chung như title, description
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = { createNew, update }
