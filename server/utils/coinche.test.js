import { countTrick, countPlayerScore, sortHand, sortByType, hasBelote } from './coinche.js';
import { DECK32 } from '../constants/decks.js';
import trumpTypes from '../../shared/constants/trumpTypes.js';

it('is counting a trick according to trump type', () => {
	const trick = ['JH', '9C', '10D', 'AS'];
	expect(countTrick(trick, trumpTypes.H)).toEqual(41);
	expect(countTrick(trick, trumpTypes.C)).toEqual(37);
	expect(countTrick(trick, trumpTypes.D)).toEqual(countTrick(trick, trumpTypes.S));
	expect(countTrick(trick, trumpTypes.NO_TRUMP)).toEqual(31);
	expect(countTrick(trick, trumpTypes.ALL_TRUMP)).toEqual(33);
	expect(countTrick(DECK32, trumpTypes.H)).toEqual(152);
});

it('is counting players score correctly', () => {
	const tricks = [
		{playerIndex: 0, cards: ['JH', '9C', 'KD', 'AS']},
		{playerIndex: 1, cards: ['JS', '9H', 'KC', 'AD']},
		{playerIndex: 2, cards: ['JD', '9S', 'KH', 'AC']},
		{playerIndex: 3, cards: ['JC', '9D', 'KS', 'AH']},
	];
	expect(countPlayerScore([], {})).toEqual({});
	expect(countPlayerScore([], trumpTypes.H)).toEqual({});
	expect(countPlayerScore(tricks, {})).toEqual({});
	expect(countPlayerScore(tricks, trumpTypes.H)).toEqual({
		0: 35,
		1: 31,
		2: 17,
		3: 17,
	});
});

it('is sorting according to trump type', () => {
	const hand = ['8H', '9S', 'QC', '9C', 'AH', 'JC', 'AD', '7H'];
	expect(sortHand(hand)).toEqual(['9S', '7H', '8H', 'AH', '9C', 'JC', 'QC', 'AD']);
	expect(sortHand(hand, 'H')).toEqual(['9S', 'AH', '8H', '7H', 'QC', 'JC', '9C', 'AD']);
	expect(sortHand(hand, 'C')).toEqual(['9S', 'AH', '8H', '7H', 'JC', '9C', 'QC', 'AD']);
	expect(sortHand(hand, 'D')).toEqual(['9S', 'AH', '8H', '7H', 'QC', 'JC', '9C', 'AD']);
	expect(sortHand(hand, 'S')).toEqual(['9S', 'AH', '8H', '7H', 'QC', 'JC', '9C', 'AD']);
	expect(sortHand(hand, trumpTypes.NO_TRUMP)).toEqual(['9S', 'AH', '8H', '7H', 'QC', 'JC', '9C', 'AD']);
	expect(sortHand(hand, trumpTypes.ALL_TRUMP)).toEqual(['9S', 'AH', '8H', '7H', 'JC', '9C', 'QC', 'AD']);
});

it('is detecting "belote et rebelote"', () => {
	const hand = ['8H', '9S', 'QC', '9C', 'AH', 'JC', 'AD', 'KC'];
	expect(hasBelote(hand, trumpTypes.NO_TRUMP)).toEqual(false);
	expect(hasBelote(hand, trumpTypes.ALL_TRUMP)).toEqual(false);
	expect(hasBelote(hand, trumpTypes.H)).toEqual(false);
	expect(hasBelote(hand, trumpTypes.S)).toEqual(false);
	expect(hasBelote(hand, trumpTypes.D)).toEqual(false);
	expect(hasBelote(hand, trumpTypes.C)).toEqual(true);
	expect(hasBelote(hand)).toEqual(false);
	expect(hasBelote([], '')).toEqual(false);
});
