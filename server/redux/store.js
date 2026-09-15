import { createStore, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import rootReducer from './root-reducer.js';
import undoReducer from './undoReducer.js';
import Redis from 'ioredis';

const INITIAL_STATE = {
  past: [],
  present: [],
  futur: [],
}

const redisURL = "redis://redis";
export const redisInstance = new Redis(redisURL);

// Every table is a Redis key with no natural owner and no account behind it —
// without an expiry, a table created once (even accidentally, or by a
// curious/malicious visitor guessing table names) stays in Redis forever.
// TABLE_TTL_SECONDS is a *sliding* expiry: it's reset on every dispatched
// action (see storeToRedis below), so an actively played game never expires
// no matter how long the players take, while a table nobody returns to is
// freed automatically a fixed idle period after its last move.
const DEFAULT_TABLE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days of inactivity
const TABLE_TTL_SECONDS = Number(process.env.TABLE_TTL_SECONDS) || DEFAULT_TABLE_TTL_SECONDS;

const checkRedisStateCorrectness = (redisState) => {
  // TODO: check if players: [], deck: [], onTable: [] are present
  return redisState;
}

const getStore = async redisKey => {
  const storeToRedis = store => next => action => {
    next(action);
    return redisInstance.set(redisKey, JSON.stringify(store.getState()), 'EX', TABLE_TTL_SECONDS)
  }

  const middlewares = [storeToRedis].concat(process.env.NODE_ENV === 'development' ? logger : []);

  const redisStateString = await redisInstance.get(redisKey);
  const redisState = JSON.parse(redisStateString);
  const initialStoreState = checkRedisStateCorrectness(redisState) || null;
  if (!initialStoreState) return createStore(undoReducer(rootReducer), applyMiddleware(...middlewares));
  return createStore(undoReducer(rootReducer), initialStoreState, applyMiddleware(...middlewares));
}

export default getStore;