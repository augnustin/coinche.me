export const emitEachInRoom = async (io, roomId, event, getData) => {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    sockets.forEach(socket => {
      socket.emit(event, getData(socket.id));
    });
  } catch (error) {
    console.error('Error emitting to room:', error);
  }
}