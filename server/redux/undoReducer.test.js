import undoReducer from './undoReducer.js';
import rootReducer, { INITIAL_STATE } from './root-reducer.js';
import actionTypes from './actionTypes.js';

// A tiny counter reducer isolates the undo/redo *mechanics* from coinche's
// own domain logic (which root-reducer.test.js already covers on its own).
const counter = (state = 0, action) => (action.type === 'INC' ? state + 1 : state);

describe('undoReducer, wrapping a trivial counter', () => {
	it('starts present at the wrapped reducer\'s own default state', () => {
		const wrapped = undoReducer(counter);
		const initial = wrapped(undefined, {});
		expect(initial).toEqual({ past: [], present: 0, future: [] });
	});

	it('pushes the old present into past on every state-changing action', () => {
		const wrapped = undoReducer(counter);
		const s1 = wrapped(undefined, {});
		const s2 = wrapped(s1, { type: 'INC' });
		expect(s2).toEqual({ past: [0], present: 1, future: [] });
		const s3 = wrapped(s2, { type: 'INC' });
		expect(s3).toEqual({ past: [0, 1], present: 2, future: [] });
	});

	it('is a true no-op (same object reference) when the action does not change anything', () => {
		const wrapped = undoReducer(counter);
		const s1 = wrapped(undefined, {});
		const s2 = wrapped(s1, { type: 'NOTHING_TO_SEE_HERE' });
		expect(s2).toBe(s1);
	});

	it('UNDO moves present back into future and restores the previous present', () => {
		const wrapped = undoReducer(counter);
		let state = wrapped(undefined, {});
		state = wrapped(state, { type: 'INC' }); // present: 1
		state = wrapped(state, { type: 'INC' }); // present: 2

		const undone = wrapped(state, { type: 'UNDO' });
		expect(undone).toEqual({ past: [0], present: 1, future: [2] });
	});

	it('REDO replays a future state back into present', () => {
		const wrapped = undoReducer(counter);
		let state = wrapped(undefined, {});
		state = wrapped(state, { type: 'INC' });
		state = wrapped(state, { type: 'INC' });
		state = wrapped(state, { type: 'UNDO' }); // present: 1, future: [2]

		const redone = wrapped(state, { type: 'REDO' });
		expect(redone).toEqual({ past: [0, 1], present: 2, future: [] });
	});

	it('a fresh action after an UNDO drops the abandoned future (no redo of a discarded branch)', () => {
		const wrapped = undoReducer(counter);
		let state = wrapped(undefined, {});
		state = wrapped(state, { type: 'INC' });
		state = wrapped(state, { type: 'INC' }); // present: 2
		state = wrapped(state, { type: 'UNDO' }); // present: 1, future: [2]

		const divergedState = wrapped(state, { type: 'INC' }); // a new present: 2, but not the same "2"
		expect(divergedState).toEqual({ past: [0, 1], present: 2, future: [] });
	});

	it('UNDO past the beginning of history leaves present undefined rather than throwing', () => {
		const wrapped = undoReducer(counter);
		const initial = wrapped(undefined, {});
		expect(() => wrapped(initial, { type: 'UNDO' })).not.toThrow();
		expect(wrapped(initial, { type: 'UNDO' }).present).toBeUndefined();
	});
});

describe('undoReducer, wrapping the real coinche reducer', () => {
	it('lets a played card be undone through the same UNDO action the client sends', () => {
		const wrapped = undoReducer(rootReducer);
		let state = wrapped(undefined, {});
		state = wrapped(state, { type: actionTypes.JOIN, payload: { playerId: 'p0', playerName: 'Gus', socketId: 's0' } });
		state = wrapped(state, { type: actionTypes.JOIN, payload: { playerId: 'p1', playerName: 'Kikoo', socketId: 's1' } });
		state = wrapped(state, { type: actionTypes.JOIN, payload: { playerId: 'p2', playerName: 'Bibi', socketId: 's2' } });
		state = wrapped(state, { type: actionTypes.JOIN, payload: { playerId: 'p3', playerName: 'Tof', socketId: 's3' } });
		state = wrapped(state, { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });

		const active = state.present.players.findIndex(p => p.isActivePlayer);
		const card = state.present.players[active].hand[0];
		const played = wrapped(state, { type: actionTypes.PLAY_CARD, payload: card });
		expect(played.present.players[active].onTable).toEqual(card);

		const undone = wrapped(played, { type: 'UNDO' });
		expect(undone.present.players[active].onTable).toBeNull(); // DISTRIBUTE's own onTable: null, restored as-is
		expect(undone.present.players[active].hand).toContain(card);
	});
});
