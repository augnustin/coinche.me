import { name, equals } from './player.js';

describe('name', () => {
	it('returns the player\'s name when set', () => {
		expect(name({ name: 'Gus' })).toEqual('Gus');
	});

	it('falls back to BOT for an unseated / empty slot', () => {
		expect(name({ name: null })).toEqual('BOT');
		expect(name({ name: '' })).toEqual('BOT');
		expect(name({})).toEqual('BOT');
	});
});

describe('equals', () => {
	it('considers two players the same seat if their index matches', () => {
		expect(equals({ index: 2, name: 'Gus' }, { index: 2, name: 'someone else\'s view of Gus' })).toBe(true);
	});

	it('considers different seats different players even with the same name', () => {
		expect(equals({ index: 0, name: 'Gus' }, { index: 1, name: 'Gus' })).toBe(false);
	});
});
