/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'
import cors from 'cors'

import { env } from '~/config/environment'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { corsOptions } from '~/config/cors'

import cookieParser from 'cookie-parser'

import http from 'http'
import socketIo from 'socket.io'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SEVER = () => {
  const app = express()

  // config: fix Cache from disk cua ExpressJs
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // config cookie parser
  app.use(cookieParser())

  app.use(cors(corsOptions))

  // Enable req.body json data
  app.use(express.json())
  // app.use(express.urlencoded())

  app.use('/v1', APIs_V1)

  // Middleware sử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  // Tao 1 server moi boc App cua express de lam real-time voi socket.id
  const server = http.createServer(app)
  // Khoi tao bien io voi server va cors
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (socket) => {
    //Goi cac socket tuy theo feature o day
    inviteUserToBoardSocket(socket)

    //...
  })

  if (env.BUILD_MODE === 'production') {
    // dung server.listen thay vi app.listen vi luc nay server da bao gom express app va da config socket.io
    server.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Production: Hello, I am running at PORT: ${env.APP_PORT}/`)
    })
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`Local Dev: Hello, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`)
    })
  }

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
