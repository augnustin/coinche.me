import {
	selectGameId,
	selectTableId,
	selectHumanPlayers,
	selectCurrentPlayer,
	selectActivePlayer,
	selectIsActivePlayer,
	selectCanCollect,
	selectTeams,
	selectPartner,
	selectCurrentDeclaration,
} from './game.js';
import { SOUTH, WEST, NORTH, EAST } from '../../../../shared/constants/positions.js';
import declarationTypes from '../../../../shared/constants/declarationTypes.js';

const buildState = (players) => ({ game: { players } });

describe('selectGameId / selectTableId', () => {
	it('reads straight through to game.gameId and game.tableId', () => {
		const state = { game: { gameId: 'g1', tableId: 't1' } };
		expect(selectGameId(state)).toEqual('g1');
		expect(selectTableId(state)).toEqual('t1');
	});

	it('is undefined before the first server broadcast, not a crash', () => {
		expect(selectGameId({ game: {} })).toBeUndefined();
	});
});

describe('selectHumanPlayers', () => {
	// This selector is exactly what fed the "0 joueurs prêts" readiness count
	// in Controls.js — a player with no real id (e.g. because their socket
	// connected with no session cookie) silently doesn't count as ready.
	it('counts only seats that actually have a player id', () => {
		const state = buildState([
			{ id: 'p0', name: 'Gus' },
			{ id: null, name: null },
			{ id: undefined, name: 'Kikoo' },
			{ id: 'p3', name: 'Tof' },
		]);
		expect(selectHumanPlayers(state)).toEqual([
			{ id: 'p0', name: 'Gus' },
			{ id: 'p3', name: 'Tof' },
		]);
	});

	it('is empty on an empty table', () => {
		expect(selectHumanPlayers(buildState([]))).toEqual([]);
	});
});

describe('selectCurrentPlayer / selectActivePlayer / selectIsActivePlayer', () => {
	it('the current (this browser\'s) player is whoever subjectiveState put at SOUTH', () => {
		const state = buildState([
			{ index: 2, position: SOUTH, name: 'Gus' },
			{ index: 3, position: WEST, name: 'Tof' },
			{ index: 0, position: NORTH, name: 'Bibi' },
			{ index: 1, position: EAST, name: 'Kikoo' },
		]);
		expect(selectCurrentPlayer(state)).toMatchObject({ name: 'Gus' });
	});

	it('flags whose turn it is regardless of where they sit on screen', () => {
		const state = buildState([
			{ index: 2, position: SOUTH, name: 'Gus', isActivePlayer: false },
			{ index: 3, position: WEST, name: 'Tof', isActivePlayer: true },
			{ index: 0, position: NORTH, name: 'Bibi', isActivePlayer: false },
			{ index: 1, position: EAST, name: 'Kikoo', isActivePlayer: false },
		]);
		expect(selectActivePlayer(state)).toMatchObject({ name: 'Tof' });
		expect(selectIsActivePlayer(state)).toBe(false); // it's Tof's turn, and we are Gus
	});

	it('selectIsActivePlayer is true when the active seat is our own', () => {
		const state = buildState([
			{ index: 2, position: SOUTH, name: 'Gus', isActivePlayer: true },
			{ index: 3, position: WEST, name: 'Tof', isActivePlayer: false },
			{ index: 0, position: NORTH, name: 'Bibi', isActivePlayer: false },
			{ index: 1, position: EAST, name: 'Kikoo', isActivePlayer: false },
		]);
		expect(selectIsActivePlayer(state)).toBe(true);
	});
});

describe('selectCanCollect', () => {
	it('is only true once all four seats have a card on the table', () => {
		const threeDown = buildState([
			{ onTable: 'AS' }, { onTable: 'AH' }, { onTable: 'AD' }, { onTable: null },
		]);
		expect(selectCanCollect(threeDown)).toBe(false);

		const fourDown = buildState([
			{ onTable: 'AS' }, { onTable: 'AH' }, { onTable: 'AD' }, { onTable: 'AC' },
		]);
		expect(selectCanCollect(fourDown)).toBe(true);
	});
});

describe('selectTeams / selectPartner', () => {
	it('pairs seats by index parity, independent of screen position', () => {
		const state = buildState([
			{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }, { id: 'p3' },
		]);
		expect(selectTeams(state)).toEqual([['p0', 'p2'], ['p1', 'p3']]);
	});

	it('finds the current player\'s partner by index, not by seat position', () => {
		const state = buildState([
			{ index: 0, position: WEST, name: 'Bibi' },
			{ index: 1, position: SOUTH, name: 'Gus' }, // "us"
			{ index: 2, position: EAST, name: 'Tof' },
			{ index: 3, position: NORTH, name: 'Kikoo' }, // same parity as Gus (index 1)
		]);
		expect(selectPartner(state)).toMatchObject({ name: 'Kikoo' });
	});
});

describe('selectCurrentDeclaration', () => {
	it('is the last real bid, skipping PASS and COINCHE entries', () => {
		const state = {
			game: {
				players: [],
				declarationsHistory: [
					{ type: declarationTypes.DECLARE, trumpType: 'H', goal: 80 },
					{ type: declarationTypes.PASS },
				],
			},
		};
		expect(selectCurrentDeclaration(state)).toEqual({ type: declarationTypes.DECLARE, trumpType: 'H', goal: 80 });
	});
});
