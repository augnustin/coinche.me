import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cookie from "cookie";
import session from "express-session";
import socketio from "socket.io";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";

import getStore from "./redux/store.js";
import subjectiveState from "./redux/subjectiveState.js";
import { emitEachInRoom } from "../shared/utils/sockets.js";
import { join, leave } from "./redux/actions.js";
import socketEvents from "../shared/constants/socketEvents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.Server(app);
const io = socketio(server);
const isProduction = app.get("env") === "production";
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.static("build"));
app.use(express.static("public"));
app.get("/*", async (req, res) => {
  res.sendFile("build/index.html", { root: `${__dirname}/..` });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: isProduction },
  })
);

app.post("/join", async (req, res) => {
  const tableId = req.body.tableId || uuid();
  res.redirect(`/game/${tableId}`);
});

const dispatchActionAndBroadcastNewState = async (tableId, action) => {
  console.log(`Action on table ${tableId}`, action);
  const store = await getStore(tableId);
  store.dispatch(action);
  const state = store.getState().present;
  return emitEachInRoom(io, tableId, socketEvents.UPDATED_STATE, (socketId) =>
    subjectiveState({ tableId, ...state }, socketId)
  );
};

try {
  io.on("connection", (socket) => {
    const playerId = process.env.IGNORE_COOKIE
      ? uuid()
      : cookie.parse(socket.handshake.headers.cookie || "")["connect.sid"];
    console.log("New socket connection", socket.id, playerId);

    socket.on(socketEvents.JOIN, async ({ tableId, username }) => {
      socket.join(tableId);
      dispatchActionAndBroadcastNewState(tableId, join({ playerId, socketId: socket.id, playerName: username }));
    });

    socket.on(socketEvents.DISPATCH, async ({ tableId, action }) => {
      dispatchActionAndBroadcastNewState(tableId, action);
    });

    socket.on(socketEvents.LEAVE, async ({ tableId }) => {
      socket.disconnect();
      dispatchActionAndBroadcastNewState(tableId, leave(socket.id));
    });

    socket.on(socketEvents.DISCONNECT, async () => {
      console.log("disconnected", socket.id);
    });
  });
} catch (e) {
  console.error("Socket error:");
  console.error(e);
}

server.listen(PORT, () => {
  console.log(`Le coincheur listening on port ${PORT}!`);
});
