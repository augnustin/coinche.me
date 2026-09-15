import { jest } from '@jest/globals';
import subjectiveState from './subjectiveState.js';
import { SOUTH, WEST, NORTH, EAST } from '../../shared/constants/positions.js';

const buildState = () => ({
	tableId: 'table-1',
	players: [
		{ id: 'p0', name: 'Gus', hand: ['AS'], sockets: ['sock-0'] },
		{ id: 'p1', name: 'Kikoo', hand: ['AH'], sockets: ['sock-1'] },
		{ id: 'p2', name: 'Bibi', hand: ['AD'], sockets: ['sock-2'] },
		{ id: 'p3', name: 'Tof', hand: ['AC'], sockets: ['sock-3'] },
	],
});

describe('subjectiveState', () => {
	it('puts the viewer in the SOUTH seat and everyone else relative to them', () => {
		const view = subjectiveState(buildState(), 'sock-2'); // Bibi (seat 2) is viewing
		const byPosition = Object.fromEntries(view.players.map(p => [p.position, p]));

		expect(byPosition[SOUTH]).toMatchObject({ name: 'Bibi', index: 2 });
		expect(byPosition[WEST]).toMatchObject({ name: 'Tof', index: 3 });
		expect(byPosition[NORTH]).toMatchObject({ name: 'Gus', index: 0 }); // wraps around
		expect(byPosition[EAST]).toMatchObject({ name: 'Kikoo', index: 1 });
	});

	it('a viewer sitting at seat 0 also lands on SOUTH (the identity rotation)', () => {
		const view = subjectiveState(buildState(), 'sock-0');
		const south = view.players.find(p => p.position === SOUTH);
		expect(south).toMatchObject({ name: 'Gus', index: 0 });
	});

	it('does NOT redact other seats\' hands — every viewer receives every hand as-is', () => {
		// Documented current behavior, not an endorsement: the client hides
		// opponents' cards purely with a CSS class (see Player.js), not here.
		const view = subjectiveState(buildState(), 'sock-2');
		expect(view.players.map(p => p.hand)).toEqual([['AD'], ['AC'], ['AS'], ['AH']]);
	});

	it('preserves every other field on the state untouched (e.g. tableId)', () => {
		const view = subjectiveState(buildState(), 'sock-0');
		expect(view.tableId).toEqual('table-1');
	});

	describe('when the socket cannot be resolved to a seat', () => {
		afterEach(() => jest.restoreAllMocks());

		it('returns the state unchanged and logs an error when socketId is missing', () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			const state = buildState();
			expect(subjectiveState(state, undefined)).toBe(state);
			expect(console.error).toHaveBeenCalled();
		});

		it('returns the state unchanged for a spectator whose socket never joined a seat', () => {
			jest.spyOn(console, 'error').mockImplementation(() => {});
			const state = buildState();
			expect(subjectiveState(state, 'sock-unknown')).toBe(state);
			expect(console.error).toHaveBeenCalled();
		});
	});
});
