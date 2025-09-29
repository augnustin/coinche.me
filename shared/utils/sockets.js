export const emitEachInRoom = (io, roomId, event, getData) => {
  // Fallback to Socket.io v2 API if fetchSockets is not available
  if (io.in(roomId).fetchSockets) {
    // Socket.io v4 approach
    io.in(roomId).fetchSockets().then(sockets => {
      sockets.forEach(socket => {
        socket.emit(event, getData(socket.id));
      });
    }).catch(error => {
      console.error('Error emitting to room:', error);
    });
  } else {
    // Socket.io v2 approach - use clients method
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
}