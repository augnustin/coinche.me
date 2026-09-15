import { selectCurrentDeclaration, selectCurrentTrumpType, selectIsCoinched, selectTeams } from './selectors.js';
import declarationTypes from '../../shared/constants/declarationTypes.js';

describe('selectCurrentDeclaration / selectCurrentTrumpType', () => {
	it('is the last real bid, ignoring PASS and COINCHE entries', () => {
		const state = {
			declarationsHistory: [
				{ playerIndex: 0, type: declarationTypes.DECLARE, trumpType: 'H', goal: 80 },
				{ playerIndex: 1, type: declarationTypes.PASS },
				{ playerIndex: 2, type: declarationTypes.COINCHE },
			],
		};
		expect(selectCurrentDeclaration(state)).toEqual({ playerIndex: 0, type: declarationTypes.DECLARE, trumpType: 'H', goal: 80 });
		expect(selectCurrentTrumpType(state)).toEqual('H');
	});

	it('picks the most recent of several real bids (an overbid)', () => {
		const state = {
			declarationsHistory: [
				{ playerIndex: 0, type: declarationTypes.DECLARE, trumpType: 'H', goal: 80 },
				{ playerIndex: 2, type: declarationTypes.DECLARE, trumpType: 'S', goal: 90 },
			],
		};
		expect(selectCurrentTrumpType(state)).toEqual('S');
	});

	it('has no current trump before anyone has bid', () => {
		expect(selectCurrentTrumpType({ declarationsHistory: [] })).toBeUndefined();
	});
});

describe('selectIsCoinched', () => {
	it('collects every COINCHE entry, in order (a SURCOINCHE would be a second one)', () => {
		const state = {
			declarationsHistory: [
				{ playerIndex: 0, type: declarationTypes.DECLARE },
				{ playerIndex: 1, type: declarationTypes.COINCHE },
			],
		};
		expect(selectIsCoinched(state)).toEqual([{ playerIndex: 1, type: declarationTypes.COINCHE }]);
	});

	it('is empty when nobody has coinched', () => {
		expect(selectIsCoinched({ declarationsHistory: [{ type: declarationTypes.DECLARE }] })).toEqual([]);
	});
});

describe('selectTeams', () => {
	it('pairs seats by parity: 0&2 are one team, 1&3 the other', () => {
		const state = {
			players: [{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
		};
		expect(selectTeams(state)).toEqual([
			{ players: ['p0', 'p2'] },
			{ players: ['p1', 'p3'] },
		]);
	});
});
