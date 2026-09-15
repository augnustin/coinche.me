import { jest } from '@jest/globals';
import {
	countTrick,
	countPlayerScore,
	sortHand,
	sortByType,
	hasBelote,
	cutDeck,
	distribute,
	distributeCoinche,
	gatherTricks,
} from './coinche.js';
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
	// No trumpType defaults to NO_TRUMP inside sortHand, so this must equal
	// the explicit trumpTypes.NO_TRUMP call below for the same hand.
	expect(sortHand(hand)).toEqual(['9S', 'AH', '8H', '7H', 'QC', 'JC', '9C', 'AD']);
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

describe('cutDeck', () => {
	afterEach(() => jest.restoreAllMocks());

	it('rotates the deck to start at a random index', () => {
		// Math.random() = 0.5 over a 4-card deck -> randomIndex = floor(0.5*4) = 2
		jest.spyOn(Math, 'random').mockReturnValue(0.5);
		expect(cutDeck(['A', 'B', 'C', 'D'])).toEqual(['C', 'D', 'A', 'B']);
	});

	it('never loses or duplicates a card, whatever the cut point', () => {
		const cut = cutDeck(DECK32);
		expect(cut.length).toEqual(DECK32.length);
		expect(cut.slice().sort()).toEqual(DECK32.slice().sort());
	});
});

describe('distribute', () => {
	const emptyPlayers = () => Array(4).fill(null).map(() => ({ hand: [] }));

	it('deals one card at a time, round-robin, starting after the dealer', () => {
		// Real DECK32-shaped cards: sortHand (called at the end of distribute)
		// only produces meaningful order for actual value+suit codes.
		const deck = ['7C', '7D', '7H', '7S', '8C', '8D', '8H', '8S'];
		const players = distribute(deck, emptyPlayers(), 0, 1);
		// dealerIndex 0 -> first card goes to seat 1, then 2, 3, 0, 1, 2, 3, 0
		expect(players[0].hand.slice().sort()).toEqual(['7S', '8S'].sort());
		expect(players[1].hand.slice().sort()).toEqual(['7C', '8C'].sort());
		expect(players[2].hand.slice().sort()).toEqual(['7D', '8D'].sort());
		expect(players[3].hand.slice().sort()).toEqual(['7H', '8H'].sort());
	});

	it('deals in batches of N cards per player before advancing', () => {
		const deck = ['7C', '7D', '7H', '8C', '8D', '8H', '9C', '9D', '9H', '10C', '10D', '10H'];
		const players = distribute(deck, emptyPlayers(), 3, 3);
		// dealerIndex 3 -> first batch of 3 goes to seat 0, next to seat 1, etc.
		expect(players[0].hand.length).toEqual(3);
		expect(players[1].hand.length).toEqual(3);
		expect(players[2].hand.length).toEqual(3);
		expect(players[3].hand.length).toEqual(3);
		const allDealt = players.flatMap(p => p.hand).slice().sort();
		expect(allDealt).toEqual(deck.slice().sort());
	});

	it('does not mutate the players array it was given', () => {
		const players = emptyPlayers();
		distribute(['7C'], players, 0, 1);
		expect(players[1].hand).toEqual([]);
	});
});

describe('distributeCoinche', () => {
	const emptyPlayers = () => Array(4).fill(null).map(() => ({ hand: [] }));

	it('deals the classic 3-2-3 coinche pattern: every card once, 8 per player', () => {
		const players = distributeCoinche(emptyPlayers(), DECK32, 0);
		players.forEach(p => expect(p.hand.length).toEqual(8));
		const allDealt = players.flatMap(p => p.hand).slice().sort();
		expect(allDealt).toEqual(DECK32.slice().sort());
	});

	it('refuses to deal anything but a full 32-card deck', () => {
		const players = emptyPlayers();
		expect(distributeCoinche(players, DECK32.slice(0, 31), 0)).toBe(players);
		expect(distributeCoinche(players, DECK32.concat(['7C']), 0)).toBe(players);
	});
});

describe('gatherTricks', () => {
	it('flattens every trick played back into one pile, keeping every card exactly once', () => {
		const tricks = [
			{ playerIndex: 0, cards: ['JH', '9C', 'KD', 'AS'] },
			{ playerIndex: 1, cards: ['7H', '8C', '10D', 'QS'] },
		];
		const gathered = gatherTricks(tricks);
		expect(gathered.length).toEqual(8);
		expect(gathered.slice().sort()).toEqual(['JH', '9C', 'KD', 'AS', '7H', '8C', '10D', 'QS'].sort());
	});

	it('returns an empty pile for a game with no completed tricks yet', () => {
		expect(gatherTricks([])).toEqual([]);
	});
});
