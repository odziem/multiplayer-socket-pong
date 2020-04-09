let playerData = {};

export const listen = (io) => {
  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('ready', (data) => {
      console.log('ready', data);
      const readyCount = Object.keys(playerData).length + 1;
      playerData[data.playerId] = {
        isReferee: readyCount % 2,
      };
      if (readyCount === 2) {
        io.emit('startGame', playerData);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('paddleMove', (data) => {
      socket.broadcast.emit('paddleMove', data);
    });

    socket.on('ballMove', (data) => {
      socket.broadcast.emit('ballMove', data);
    });
  });
}