/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    // chuyển data -> service
    const createdBoard = await boardService.createNew(req.body)

    // trả result cho client
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id

    const board = await boardService.getDetails(boardId)

    // trả result cho client
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id

    const updatedBoard = await boardService.update(boardId, req.body)

    // trả result cho client
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew,
  getDetails,
  update,
}
