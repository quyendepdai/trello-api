/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    // chuyển data -> service
    const createdBoard = await boardService.createNew(userId, req.body)

    // trả result cho client
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const boardId = req.params.id

    const board = await boardService.getDetails(userId, boardId)

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

const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)

    // trả result cho client
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    // page, itemsPerPage duoc truyen vao trong query url tu phia FE
    const { page, itemsPerPage, q } = req.query

    const queryFilters = q

    const results = await boardService.getBoards(userId, page, itemsPerPage, queryFilters)

    // trả result cho client
    res.status(StatusCodes.OK).json(results)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards,
}
