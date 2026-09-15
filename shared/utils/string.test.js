import { pluralize, feminize, capitalize } from './string.js';

describe('pluralize', () => {
	// Real call sites always pass the count first, e.g.
	// pluralize(humanPlayers.length, 'joueur prêt') in Controls.js.
	it('prefixes the count and leaves singular words alone at 0 or 1', () => {
		expect(pluralize(1, 'joueur prêt')).toEqual('1 joueur prêt');
		expect(pluralize(0, 'joueur prêt')).toEqual('0 joueur prêt');
	});

	it('prefixes the count and pluralizes every word for 2+', () => {
		expect(pluralize(3, 'joueur prêt')).toEqual('3 joueurs prêts');
		expect(pluralize(2, 'pli')).toEqual('2 plis');
	});

	it('accepts the word first instead, but then omits the count prefix', () => {
		expect(pluralize('joueur prêt', 3)).toEqual('joueurs prêts');
		expect(pluralize('joueur prêt', 1)).toEqual('joueur prêt');
	});
});

describe('feminize', () => {
	it('uses the supplied feminine form when given one', () => {
		expect(feminize('joueur', 'f', 'joueuse')).toEqual('joueuse');
	});

	it('appends -e when feminine but no dedicated form was supplied', () => {
		expect(feminize('joueur', 'f')).toEqual('joueure');
	});

	it('leaves a masculine word untouched', () => {
		expect(feminize('joueur', 'm')).toEqual('joueur');
	});

	it('falls back to inclusive "·e" writing when no gender is given', () => {
		expect(feminize('joueur')).toEqual('joueur·e');
	});
});

describe('capitalize', () => {
	it('capitalizes only the first letter', () => {
		expect(capitalize('gus')).toEqual('Gus');
		expect(capitalize('kikoo BOT')).toEqual('Kikoo BOT');
	});

	it('handles an empty string without throwing', () => {
		expect(capitalize('')).toEqual('');
	});
});
