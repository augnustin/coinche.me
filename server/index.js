import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import cookie from 'cookie';
import session from 'express-session';
import socketio from 'socket.io';
import { v4 as uuid } from 'uuid';

import getStore from './redux/store';
import subjectiveState from './redux/subjectiveState';
import {emitEachInRoom} from '../shared/utils/sockets';
import {join, leave} from './redux/actions';
import socketEvents from '../shared/constants/socketEvents';

const app = express();
const server = http.Server(app);
const io = socketio(server);
const isProduction = app.get('env') === 'production';
const PORT = process.env.PORT || 3000;

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: isProduction }
}))
app.use(express.static('build'));
app.use(express.static('public'));

app.post('/join', async (req, res) => {
  const tableId = req.body.tableId || uuid();
  res.redirect(`/game/${tableId}`)
});

app.get('/*', async (req, res) => {
  res.sendFile('build/index.html', {root: `${__dirname}/..`});
});

const dispatchActionAndBroadcastNewState = async (tableId, action) => {
  console.log(`Action on table ${tableId}`, action)
  const store = await getStore(tableId);
  store.dispatch(action);
  const state = store.getState().present;
  return emitEachInRoom(io, tableId, socketEvents.UPDATED_STATE, socketId => subjectiveState({tableId, ...state}, socketId));
}

// try {
  io.on('connection', socket => {
    const playerId = process.env.IGNORE_COOKIE ? uuid() : cookie.parse(socket.handshake.headers.cookie || '')['connect.sid'];
    console.log('New socket connection', socket.id, playerId)

    socket.on(socketEvents.JOIN, async ({tableId, username}) => {
      socket.join(tableId);
      dispatchActionAndBroadcastNewState(tableId, join({playerId, socketId: socket.id, playerName: username}))
    })

    socket.on(socketEvents.DISPATCH, async ({tableId, action}) => {
      dispatchActionAndBroadcastNewState(tableId, action)
    });

    socket.on(socketEvents.LEAVE, async ({tableId}) => {
      socket.disconnect();
      dispatchActionAndBroadcastNewState(tableId, leave(socket.id))
    });

    socket.on(socketEvents.DISCONNECT, async () => {
      console.log('disconnected', socket.id);
    })
  });
// } catch(e) {
//   console.error('Socket error:')
//   console.error(e);
// }

server.listen(PORT, () => {
  console.log(`Le coincheur listening on port ${PORT}!`)
})