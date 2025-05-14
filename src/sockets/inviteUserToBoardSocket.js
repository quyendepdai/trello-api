// Param socket lay tu thi vien socket.io
export const inviteUserToBoardSocket = (socket) => {
  // lang nghe su kien do FE emit len co ten: FE_USER_INVITED_TO_BOARD
  // invitation: do FE gui len
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    // Cach lam don gian va nhanh nhat: Emit nguoc lai 1 su kien ve cho moi client (ngoai tru chinh user gui request len), r phia FE se check
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}
