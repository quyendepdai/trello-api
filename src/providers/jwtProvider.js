import JWT from 'jsonwebtoken'

/**
 * Func tạo mới 1 token - cần 3 tham số đầu vào
 * userInfo: Những thông tin đính kèm vào token
 * secretSignature: chữ ký bí mật ( dạng chuỗi ngẫu nhiên)
 * tokenLife: time sống của token
 */
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    //Hàm sign() của thư viện JWT - thuật toán mặc định là HS256
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Func kiểm tra xem 1 token có hợp lệ ko
 */
const verifyToken = async (token, secretSignature) => {
  try {
    //Hàm verify cua thu vien JWT
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken,
}
