import { jest } from '@jest/globals';
import {
	shuffle,
	randomIndex,
	random,
	first,
	last,
	addIndex,
	nextIndex,
	next,
	firstIndex,
	switchIndexes,
	shift,
	range,
	include,
	groupBy,
	partition,
} from './array.js';

describe('shuffle', () => {
	afterEach(() => jest.restoreAllMocks());

	it('keeps every element, just reorders them', () => {
		const original = [1, 2, 3, 4, 5];
		const shuffled = shuffle(original.slice());
		expect(shuffled.slice().sort()).toEqual(original.slice().sort());
	});

	it('mutates and returns the same array it was given (Fisher-Yates in place)', () => {
		const a = [1, 2, 3];
		expect(shuffle(a)).toBe(a);
	});
});

describe('randomIndex / random', () => {
	afterEach(() => jest.restoreAllMocks());

	it('picks an in-bounds index', () => {
		jest.spyOn(Math, 'random').mockReturnValue(0.99);
		expect(randomIndex(['a', 'b', 'c', 'd'])).toEqual(3);
	});

	it('random() returns the element at that index', () => {
		jest.spyOn(Math, 'random').mockReturnValue(0);
		expect(random(['a', 'b', 'c'])).toEqual('a');
	});
});

describe('first / last', () => {
	it('returns the first and last element', () => {
		expect(first([1, 2, 3])).toEqual(1);
		expect(last([1, 2, 3])).toEqual(3);
	});

	it('returns undefined for an empty array', () => {
		expect(first([])).toBeUndefined();
		expect(last([])).toBeUndefined();
	});
});

describe('addIndex / nextIndex / next', () => {
	it('wraps around the end of the array', () => {
		const seats = ['A', 'B', 'C', 'D'];
		expect(addIndex(seats, 3, 1)).toEqual(0);
		expect(nextIndex(seats, 3)).toEqual(0);
		expect(next(seats, 3)).toEqual('A');
	});

	it('advances by one within bounds', () => {
		const seats = ['A', 'B', 'C', 'D'];
		expect(nextIndex(seats, 0)).toEqual(1);
		expect(next(seats, 0)).toEqual('B');
	});
});

describe('firstIndex', () => {
	it('returns the first real, non-negative index in the list', () => {
		expect(firstIndex([-1, undefined, 2, 3])).toEqual(2);
		expect(firstIndex([0, 5])).toEqual(0);
	});

	it('returns undefined when nothing qualifies', () => {
		expect(firstIndex([-1, undefined, NaN])).toBeUndefined();
	});
});

describe('switchIndexes', () => {
	it('swaps two elements and leaves the rest untouched', () => {
		const seats = ['A', 'B', 'C', 'D'];
		expect(switchIndexes(seats, 0, 2)).toEqual(['C', 'B', 'A', 'D']);
	});

	it('does not mutate the original array', () => {
		const seats = ['A', 'B', 'C', 'D'];
		switchIndexes(seats, 0, 2);
		expect(seats).toEqual(['A', 'B', 'C', 'D']);
	});
});

describe('shift', () => {
	it('rotates the array to start at the given index, wrapping around', () => {
		expect(shift(['A', 'B', 'C', 'D', 'E'], 2)).toEqual(['C', 'D', 'E', 'A', 'B']);
	});

	it('is a no-op when shifting by 0', () => {
		expect(shift(['A', 'B', 'C'], 0)).toEqual(['A', 'B', 'C']);
	});
});

describe('range', () => {
	it('builds an inclusive range of numeric strings', () => {
		expect(range(7, 10)).toEqual(['7', '8', '9', '10']);
	});

	it('returns a single-element range when from equals to', () => {
		expect(range(5, 5)).toEqual(['5']);
	});
});

describe('include', () => {
	it('finds an element that is present', () => {
		expect(include(['A', 'B', 'C'], 'B')).toBe(true);
	});

	it('reports absence honestly', () => {
		expect(include(['A', 'B', 'C'], 'Z')).toBe(false);
	});
});

describe('groupBy', () => {
	it('buckets elements by the key function', () => {
		const cards = ['7C', '8C', '7D'];
		const bySuit = groupBy(cards, c => c.slice(-1));
		expect(bySuit).toEqual({ C: ['7C', '8C'], D: ['7D'] });
	});
});

describe('partition', () => {
	it('splits elements into indexed buckets, preserving order within each', () => {
		const players = ['p0', 'p1', 'p2', 'p3'];
		const teams = partition(players, (p, i) => i % 2);
		expect(teams).toEqual([['p0', 'p2'], ['p1', 'p3']]);
	});
});
