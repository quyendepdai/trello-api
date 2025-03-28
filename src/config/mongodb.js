import { env } from '~/config/environment'

// do pass có chứa ký tự đặc biệt
const password = encodeURIComponent(env.PASS_MONGO)
const mongoUri = `${env.MONGODB_URI_BEFORE + password + env.MONGODB_URI_AFTER}`

import { MongoClient, ServerApiVersion } from 'mongodb'

// Khởi tạo 1 đối tượng ban đầu là null (vì chưa connect)
let trelloDatabaseInstance = null

// Khởi 1 đối tượng mongoClientInstance để connect với Mongo
const mongoClientInstance = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

export const CONNECT_DB = async () => {
  // Connect the client to the server
  await mongoClientInstance.connect()

  //Kết nối thành công thì lấy ra dataBase theo tên
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

// Có nhiệm vụ export ra trelloDatabaseInstance sau khi connect thành công tới DB -> để cta sử dụng đc ở nhiều nới khác nhau
// Lưu ý phải đảm bảo luôn gọi cái GET_DB sau khi kết nối DB thành công
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Must connect to database first')

  return trelloDatabaseInstance
}

export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}
