/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'

import { env } from '~/config/environment'

import { GET_DB, CONNECT_DB, CLOSE_DB } from '~/config/mongodb'

const START_SEVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.end('<h1>Hello World!</h1>')
  })

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Hello, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  })

  // Close connect db when exit sever
  exitHook(() => {
    CLOSE_DB()
    console.log(` --> Exiting Server`)
  })
}

//cach 2
//chỉ khi kết nối với database thành công thì mới start server backend
;(async () => {
  try {
    console.log('Connecting db....')
    await CONNECT_DB()
    console.log('Connected to MongoDB Atlas')
    START_SEVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()

//cach 1
//chỉ khi kết nối với database thành công thì mới start server backend
// CONNECT_DB()
//   .then(() => console.log('Connected to MongoDB Atlas'))
//   .then(() => START_SEVER())
//   .catch((error) => {
//     console.error(error)
//     process.exit(0)
//   })
