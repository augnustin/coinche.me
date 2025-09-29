import {isNumber} from './boolean.js';

export const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const randomIndex = a => {
  return Math.floor(Math.random() * a.length);
}
export const random = a => {
  return a[randomIndex(a)];
}

export const first = a => a[0];
export const last = a => a[a.length - 1];
export const addIndex = (a, i, j) => (i+j) % a.length;
export const nextIndex = (a, i) => addIndex(a, i, 1);
export const next = (a, i) => a[nextIndex(a, i)];

export const firstIndex = indexes => indexes.find(i => isNumber(i) && i > -1)

export const switchIndexes = (a, index1, index2) => {
  return Object.assign([], a, {[index1]: a[index2], [index2]: a[index1]});
};

export const shift = (a, firstIndex) => a.map((el, i, arr) => arr[addIndex(arr, firstIndex, i)])

export const range = (from, to) => {
  return [...Array(to - from + 1).keys()].map(i => `${i+from}`)
}

export const include = (array, elem) => array.indexOf(elem) > -1;

export const groupBy = (array, mapFunc) => {
  return array.reduce((result, elem, i) => {
    const key = mapFunc(elem, i, result);
    return {
      ...result,
      [key]: (result[key] || []).concat(elem),
    }
  }, {});
};

export const partition = (array, mapFunc) => {
  return array.reduce((result, elem, i) => {
    const key = mapFunc(elem, i, result);
    result[key] = (result[key] || []).concat(elem);
    return result
  }, []);
};

