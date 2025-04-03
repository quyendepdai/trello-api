// clone .env để sử dụng nhiều nơi và đa dạng

import 'dotenv/config'

export const env = {
  MONGODB_URI_BEFORE: process.env.MONGODB_URI_BEFORE,
  MONGODB_URI_AFTER: process.env.MONGODB_URI_AFTER,
  PASS_MONGO: process.env.PASS_MONGO,
  DATABASE_NAME: process.env.DATABASE_NAME,
  APP_HOST: process.env.APP_HOST,
  APP_PORT: process.env.APP_PORT,

  BUILD_MODE: process.env.BUILD_MODE,
}
