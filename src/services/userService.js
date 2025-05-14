import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/brevoProvider'
import { JwtProvider } from '~/providers/jwtProvider'
import { env } from '~/config/environment'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'

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
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = `Please verify your email before using our services!`
    const htmlContent = `
      <h3>Here is your verification link!</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,</br>- Quyen Hero -</h3>
    `

    // Call provider gui mail
    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)

    // return tra ve cho controller
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    //check user
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')

    if (existUser.isActive)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')

    if (reqBody.token !== existUser.verifyToken)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')

    // moi thu ok -> update user
    const updateData = {
      isActive: true,
      verifyToken: null,
    }

    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    //check user
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')

    if (!existUser.isActive)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your email or password is incorrect!')
    }

    // moi thu ok -> tao Tokens dang nhap tra ve cho phia FE
    // Tao thong tin de dinh kem trong JWT Token bao gom: _id va email user
    const userInfo = {
      _id: existUser._id,
      email: existUser.email,
    }

    // Tao accessToken va refreshToken tra ve cho FE
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE,
    )

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE,
    )

    // Tra ve thong tin user kem theo 2 loai token vua tao
    return {
      accessToken,
      refreshToken,
      ...pickUser(existUser),
    }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    // verify refreshToken co hop le ko
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
    )

    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email,
    }

    // create new accessToken
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE,
    )

    return { accessToken }
  } catch (error) {
    throw error
  }
}

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    //check user
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')
    }

    // Khoi tao ket qua update user
    let updatedUser = {}

    //case: change password
    if (reqBody.current_password && reqBody.new_password) {
      // check currentPassword
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your current password is incorrect!')
      }

      // hash new password and update
      updatedUser = await userModel.update(userId, {
        password: bcryptjs.hashSync(reqBody.new_password, 8),
      })
    } else if (userAvatarFile) {
      // case: upload user avatar -> cloudinary
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')

      // Luu lai url cua file anh vao trong DB
      updatedUser = await userModel.update(userId, {
        avatar: uploadResult.secure_url,
      })
    } else {
      // Case update thong tin chung:  displayName
      updatedUser = await userModel.update(userId, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = { createNew, verifyAccount, login, refreshToken, update }
