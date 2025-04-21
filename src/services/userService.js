import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    //B1: kiem tra email da ton tai chua
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    //B2: tao data de luu vao Database
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8), // tham so thu 2 la do phuc tap, so cang cao thi bam cang lau
      username: nameFromEmail,
      displayName: nameFromEmail, // mặc định để giống username, về sau làm tính năng update cho user
      verifyToken: uuidv4(),
    }

    // thuc hien luu user vào DB và lấy về userInfo
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    //B3: Gui email cho nguoi dung xac thuc

    // return tra ve cho controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

export const userService = { createNew }
