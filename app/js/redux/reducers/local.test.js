import localReducer from './local.js';
import { localActionTypes } from '../actionsTypes.js';

describe('local reducer', () => {
	it('defaults the last trick to hidden', () => {
		expect(localReducer(undefined, {})).toEqual({ isLastTrickVisible: false });
	});

	it('TOGGLE_IS_LAST_TRICK_VISIBLE flips the flag each time it fires', () => {
		const shown = localReducer(undefined, { type: localActionTypes.TOGGLE_IS_LAST_TRICK_VISIBLE });
		expect(shown.isLastTrickVisible).toBe(true);
		const hiddenAgain = localReducer(shown, { type: localActionTypes.TOGGLE_IS_LAST_TRICK_VISIBLE });
		expect(hiddenAgain.isLastTrickVisible).toBe(false);
	});

	it('ignores actions it does not know about', () => {
		const state = { isLastTrickVisible: true };
		expect(localReducer(state, { type: 'SOME_UNRELATED_ACTION' })).toBe(state);
	});
});
