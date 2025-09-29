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
const redisInstance = new Redis(redisURL);

const checkRedisStateCorrectness = (redisState) => {
  // TODO: check if players: [], deck: [], onTable: [] are present
  return redisState;
}

const getStore = async redisKey => {
  const storeToRedis = store => next => action => {
    next(action);
    return redisInstance.set(redisKey, JSON.stringify(store.getState()))
  }

  const middlewares = [storeToRedis].concat(process.env.NODE_ENV === 'development' ? logger : []);

  const redisStateString = await redisInstance.get(redisKey);
  const redisState = JSON.parse(redisStateString);
  const initialStoreState = checkRedisStateCorrectness(redisState) || null;
  if (!initialStoreState) return createStore(undoReducer(rootReducer), applyMiddleware(...middlewares));
  return createStore(undoReducer(rootReducer), initialStoreState, applyMiddleware(...middlewares));
}

export default getStore;