import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { BOARD_TYPE } from '~/utils/constants'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { pagingSkipValue } from '~/utils/algorithms'
import { userModel } from './userModel'

//Define Collection (Name & Schema)

const BOARD_COLLECTION_NAME = 'boards'

const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(BOARD_TYPE.PUBLIC, BOARD_TYPE.PRIVATE).required(),

  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  // nhung admin cua board
  ownerIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  // nhung thanh vien da join board
  memberIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

// not allow update these fields
const INVALID_UPDATE_FIELD = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (userId, newBoard) => {
  try {
    const validData = await validateBeforeCreate(newBoard)

    const newBoardToAdd = {
      ...validData,
      ownerIds: [new ObjectId(userId)],
    }

    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardToAdd)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (boardId) => {
  try {
    return await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(boardId) })
  } catch (error) {
    throw new Error(error)
  }
}

// aggregate query tổng hợp (join table)
const getDetails = async (userId, boardId) => {
  try {
    const queryConditions = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(userId)] } },
          { memberIds: { $all: [new ObjectId(userId)] } },
        ],
      },
    ]

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $match: { $and: queryConditions },
        },
        {
          $lookup: {
            from: columnModel.COLUMN_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardId',
            as: 'columns',
          },
        },
        {
          $lookup: {
            from: cardModel.CARD_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardId',
            as: 'cards',
          },
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'ownerIds',
            foreignField: '_id',
            as: 'owners',
            // chỉ định field ko trả về
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }],
          },
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'memberIds',
            foreignField: '_id',
            as: 'members',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }],
          },
        },
      ])
      .toArray()

    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

// Push columnId -> array columnOrderIds
//dùng toán tử $push để đẩy 1 phần tử vào cuối mang
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(column.boardId),
        },
        { $push: { columnOrderIds: new ObjectId(column._id) } },
        { returnDocument: 'after' },
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (boardId, updateData) => {
  try {
    // delete field not allow
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELD.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    //Đối với datas liên quan đến ObjectID thì biến đổi ở đây
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map((_id) => new ObjectId(_id))
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(boardId),
        },
        { $set: updateData },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

//dùng toán tử $pull để lấy 1 phần tử ra khỏi mảng
const pullColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(column.boardId),
        },
        { $pull: { columnOrderIds: new ObjectId(column._id) } },
        { returnDocument: 'after' },
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getBoards = async (userId, page, itemsPerPage, queryFilters) => {
  try {
    const queryConditions = [
      { _destroy: false }, // DK 01: Boards chua bi xoa
      // DK 02: userId dang thuc hien request phai la thanh vien ( thong qua 2 mang ownerIds hoac memberIds) su dung toan tu $all cua mongoDb
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(userId)] } },
          { memberIds: { $all: [new ObjectId(userId)] } },
        ],
      },
    ]

    // xu ly query filter cho tung case search board
    // case search title
    if (queryFilters) {
      Object.keys(queryFilters).forEach((key) => {
        // co phan biet chu hoa chu thuong
        // queryConditions.push({ [key]: { $regex: queryFilters[key] } })

        // ko phan biet
        queryConditions.push({ [key]: { $regex: new RegExp(queryFilters[key], 'i') } })
      })
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate(
        [
          { $match: { $and: queryConditions } }, // DK 01 & DK 02
          { $sort: { title: 1 } },
          // $facet de su li nhieu luong trong 1 query
          {
            $facet: {
              // luong thu 01: Query Boards
              queryBoards: [
                { $skip: pagingSkipValue(page, itemsPerPage) },
                { $limit: itemsPerPage },
              ],
              // 02: dem so luong Boards va tra ve bien countedAllBoards
              queryTotalBoards: [{ $count: 'countedAllBoards' }],
            },
          },
        ],
        // fig bug sort chu B dung trc a
        { collation: { locale: 'en' } },
      )
      .toArray()

    const res = result[0]

    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0,
    }
  } catch (error) {
    throw new Error(error)
  }
}

const pushMemberIds = async (boardId, userId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(boardId),
        },
        { $push: { memberIds: new ObjectId(userId) } },
        { returnDocument: 'after' },
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  pullColumnOrderIds,
  getBoards,
  pushMemberIds,
}
