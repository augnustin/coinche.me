import {range} from '../../shared/utils/array.js';

const colorLetters = ['C', 'D', 'H', 'S'];
const headsLetters = ['J', 'Q', 'K', 'A'];
const numbers52 = range(2, 10).concat(headsLetters);
const numbers32 = range(7, 10).concat(headsLetters);

const buildDeck = (numbers, letters) => {
  return numbers.reduce((result, nb) => {
    return letters.reduce((subresult, l) => subresult.concat(`${nb}${l}`), result);
  }, []);
}

export const DECK32 = buildDeck(numbers32, colorLetters);
export const DECK52 = buildDeck(numbers52, colorLetters);