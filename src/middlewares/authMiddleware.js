import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/jwtProvider'
import ApiError from '~/utils/ApiError'

// Xac thuc JWT accessToken gui len tu phia FE co hop le ko
const isAuthorized = async (req, res, next) => {
  // lay accessToken trong request cookie phia FE - withCredentials trong authorizeAxios
  const clientAccessToken = req.cookies?.accessToken

  // neu ko ton tai
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized, token not found'))
    return
  }

  try {
    //b1: giai ma xem token co hop le ko
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
    )

    //b2: Neu token hop le, thi can phai luu thong tin vao req.jwtDecoded, su dung cho cac tang su ly phia sau
    req.jwtDecoded = accessTokenDecoded

    //b3: next()
    next()
  } catch (error) {
    //Neu token het han(expired) thi can tra ve ma loi GONE-410 cho phia FE de goi api refreshToken
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }

    // Neu accessToken khong hop le do bat ky dieu gi ngoai het han thi tra truc tiep ve loi 401 de FE call api sign out
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'))
  }
}

export const authMiddleware = {
  isAuthorized,
}
