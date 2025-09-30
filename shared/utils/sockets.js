export const emitEachInRoom = (io, roomId, event, getData) => {
  io.to(roomId).clients((error, clients) => {
    if (error) {
      console.error('Error getting clients:', error);
      return;
    }
    clients.forEach(clientId => {
      io.to(clientId).emit(event, getData(clientId));
    });
  });
}