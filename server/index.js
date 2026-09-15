import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cookie from "cookie";
import session from "express-session";
import { Server } from "socket.io";
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
const io = new Server(server);
const isProduction = app.get("env") === "production";
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

// Session must be registered before the static/catch-all handlers below.
// Express runs middleware in registration order, and the catch-all matches
// every GET request (including the very first page load of any route, e.g.
// a shared /game/:tableId link) — if session() were registered after it, no
// GET request would ever receive a session cookie, and only the POST /join
// endpoint would. That left every visitor who lands directly on a game link
// (rather than going through the join form first) with no connect.sid cookie,
// so the server resolved their playerId as undefined for their entire session.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: isProduction },
  })
);

app.use(express.static("build"));
app.use(express.static("public"));

app.post("/join", async (req, res) => {
  const tableId = req.body.tableId || uuid();
  res.redirect(`/game/${tableId}`);
});

app.get("/*", async (req, res) => {
  res.sendFile("build/index.html", { root: `${__dirname}/..` });
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
    // Falling back to socket.id (instead of leaving playerId undefined) matters
    // when a visitor has no connect.sid cookie for any reason (cookies blocked,
    // misconfigured SESSION_KEY, etc.): without it, every such visitor would
    // resolve to the same `undefined` playerId and silently collide onto the
    // same seat, since the JOIN reducer matches players by `p.id === playerId`.
    const playerId = process.env.IGNORE_COOKIE
      ? uuid()
      : cookie.parse(socket.handshake.headers.cookie || "")["connect.sid"] || socket.id;
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
