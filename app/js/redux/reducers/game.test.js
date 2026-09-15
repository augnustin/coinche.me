import gameReducer from './game.js';
import { socketActionTypes } from '../actionsTypes.js';

describe('game reducer', () => {
	it('starts empty until the first server broadcast arrives', () => {
		expect(gameReducer(undefined, {})).toEqual({});
	});

	it('UPDATED_SERVER_STATE fully replaces local state with the server\'s broadcast', () => {
		const staleLocalState = { players: [{ name: 'stale' }], gameId: 'old-game' };
		const serverBroadcast = { players: [{ name: 'Gus', id: 'p0' }], gameId: 'new-game', tableId: 't1' };

		const next = gameReducer(staleLocalState, { type: socketActionTypes.UPDATED_SERVER_STATE, payload: serverBroadcast });
		expect(next).toEqual(serverBroadcast); // nothing of staleLocalState survives — it's a replace, not a merge
	});

	it('RESET_LOCAL_GAME is currently a documented no-op, despite its name', () => {
		// Read literally the name promises a reset; the implementation just
		// returns the same state. Pinned here so a future "fix" that actually
		// clears state is a deliberate choice, not an accidental behavior change.
		const state = { players: [{ name: 'Gus' }] };
		expect(gameReducer(state, { type: socketActionTypes.RESET_LOCAL_GAME })).toBe(state);
	});

	it('ignores actions it does not know about', () => {
		const state = { players: [] };
		expect(gameReducer(state, { type: 'SOME_UNRELATED_ACTION' })).toBe(state);
	});
});
