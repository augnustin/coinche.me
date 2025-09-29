import trumpTypes from '../../shared/constants/trumpTypes.js';

const trumpScore = {
  "J": 20,
  "9": 14,
  "A": 11,
  "10": 10,
  "K": 4,
  "Q": 3,
  "8": 0,
  "7": 0,
};

const defaultScore = {
  "A": 11,
  "10": 10,
  "K": 4,
  "Q": 3,
  "J": 2,
  "9": 0,
  "8": 0,
  "7": 0,
};

const allTrumpScore = {
  "J": 14,
  "9": 9,
  "A": 6,
  "10": 4,
  "K": 3,
  "Q": 2,
  "8": 0,
  "7": 0,
};

const noTrumpScore = {
  "A": 19,
  "10": 10,
  "K": 4,
  "Q": 3,
  "J": 2,
  "9": 0,
  "8": 0,
  "7": 0,
};

const gameScore = {
  trumpScore,
  defaultScore,
  allTrumpScore,
  noTrumpScore,
};

export default gameScore;


