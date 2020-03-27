import express from 'express';
<<<<<<< HEAD
import { v4 as uuid } from 'uuid';
=======
import { createStore, applyMiddleware } from 'redux';
>>>>>>> server-side-store

const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const server = require('http').Server(app);
const io = require('socket.io')(server);

const Redis = require('ioredis');
const redisURL = "redis://redis";
<<<<<<< HEAD

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
=======
const redisInstance = new Redis(redisURL);
const redisKey = 'XXXXXX';
>>>>>>> server-side-store
app.use(express.static('build'));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
const redis = new Redis(redisURL);

app.post('/createTable', (req, res) => {
  const tableId = uuid();
  const {username} = req.body;
  redis.set(tableId, [username]);
  res.send({tableId})
});

app.post('/joinTable', async (req, res) => {
  const {tableId, username} = req.body;
  res.send({tableId: tableId})
});
=======
const rootReducer = (state = {test: 'coucou'}, action) => {
  switch (action.type) {
    case 'RECEIVE':
      return {test: action.payload.message};
    default:
      return state;
  }
}

const storeToRedis = store => next => action => {
  next(action);
  return redisInstance.set('redisKey', store.getState()).then(v => console.log(v))
}
>>>>>>> server-side-store

const broadcastToClients = store => next => action => {
  console.log(action)
  const returnValue = next(action)
  // Do the broadcast
  return returnValue;
};

const store = createStore(rootReducer, applyMiddleware(...[storeToRedis, broadcastToClients]));

console.log(store.getState());

store.dispatch({
  type: 'RECEIVE',
  payload: {
    message: 'hello',
  },
})

console.log(store.getState());

io.on('connection', (socket) => {
  //socket.on('disconnect', reason => console.log(socket.id));

  socket.on('joinTable', data => {
    const {tableId, username} = data
    console.log(`User ${username} joining table ${tableId}`)
    socket.join(tableId)
  });

  socket.on('leaveTable', data => {
    console.log(`User ${username} leaving table ${tableId}`)
    socket.leave(tableId);
  });

  socket.on('cardsDistributed', (data) => {
    const {table, hands} = data
    console.log('Broadcasting to the table', table, data);
    socket.emit('cardsDistributed', hands);
    socket.broadcast
    .to(table)
    .emit('cardsDistributed', hands);
  });

});

server.listen(PORT, () => {
  console.log(`Le coincheur listening on port ${PORT}!`)
})