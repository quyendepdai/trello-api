/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

import { cloneDeep } from 'lodash'

const createNew = async (reqBody) => {
  try {
    // Xử lý logic dữ liệu tùy đặc thù dự án
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title),
    }

    //Gọi tới tầng model để lưu dữ liệu
    const createdBoard = await boardModel.createNew(newBoard)

    // Lấy bản ghi board vừa tạo
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)

    //Lm thêm các xử lý logic với các Collection khác tùy dự án...
    // Bắn email, notification về cho admin khi có board mới đc tạo
    //...

    // Trả về dữ liệu (phải có return)
    return getNewBoard
  } catch (error) {
    throw error
  }
}

const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(boardId)

    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    }

    // clone ra một bản copy hoàn toàn mới khác trong bộ nhớ tránh ảnh hưởng đến dữ liệu gốc
    const resBoard = cloneDeep(board)

    // Đưa cards về đúng column
    resBoard.columns.forEach((column) => {
      // cần toString vì mongodb trả về ObjectId
      // column.cards = resBoard.cards.filter(
      //   (card) => card.columnId.toString() === column._id.toString(),
      // )

      //cách 2
      // Vì đều là ObjectId nên Mongodb support method equals
      column.cards = resBoard.cards.filter((card) => card.columnId.equals(column._id))
    })

    delete resBoard.cards

    return resBoard
  } catch (error) {
    throw error
  }
}

const update = async (boardId, reqBody) => {
  try {
    const updateData = { ...reqBody, updatedAt: Date.now() }
    const updatedBoard = await boardModel.update(boardId, updateData)

    return updatedBoard
  } catch (error) {
    throw error
  }
}

export const boardService = { createNew, getDetails, update }
