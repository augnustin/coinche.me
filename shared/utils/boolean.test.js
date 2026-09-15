import { isNumber, isString, isDate, isArray, isObject, isFunction, isBlank, isPresent } from './boolean.js';

describe('type guards', () => {
	it('isNumber', () => {
		expect(isNumber(3)).toBe(true);
		expect(isNumber('3')).toBe(false);
	});

	it('isString', () => {
		expect(isString('hi')).toBe(true);
		expect(isString(3)).toBe(false);
	});

	it('isDate', () => {
		expect(isDate(new Date())).toBe(true);
		expect(isDate('2024-01-01')).toBe(false);
		// isDate is `value && typeof value.getMonth === 'function'` — for a
		// falsy input it short-circuits to that falsy value itself, not to a
		// normalized `false`.
		expect(isDate(null)).toBe(null);
	});

	it('isArray', () => {
		expect(isArray([1, 2])).toBe(true);
		expect(isArray({ length: 2 })).toBe(false);
	});

	it('isObject (and that null is deliberately excluded, unlike bare typeof)', () => {
		expect(isObject({})).toBe(true);
		expect(isObject(null)).toBe(false);
	});

	it('isFunction', () => {
		expect(isFunction(() => {})).toBe(true);
		expect(isFunction(3)).toBe(false);
	});
});

describe('isBlank / isPresent', () => {
	it('treats null, undefined and whitespace-only strings as blank', () => {
		expect(isBlank(null)).toBe(true);
		expect(isBlank(undefined)).toBe(true);
		expect(isBlank('   ')).toBe(true);
		expect(isBlank('')).toBe(true);
	});

	it('treats an array as blank only when every element is blank', () => {
		expect(isBlank([])).toBe(true);
		expect(isBlank([null, ''])).toBe(true);
		expect(isBlank([null, 'Gus'])).toBe(false);
	});

	it('treats a plain object as blank only when every value is blank', () => {
		expect(isBlank({})).toBe(true);
		expect(isBlank({ name: null })).toBe(true);
		expect(isBlank({ name: 'Gus' })).toBe(false);
	});

	it('surprisingly treats every Date as blank, since isDate() is OR-ed in unconditionally', () => {
		// isDate() on a real Date always returns true, and isBlank ORs isDate
		// straight into the result — so no Date object can ever be "present".
		// Documented as current behavior, not endorsed as intentional.
		expect(isBlank(new Date())).toBe(true);
	});

	it('treats real content and non-zero-ish numbers as present', () => {
		expect(isBlank('Gus')).toBe(false);
		expect(isBlank(0)).toBe(false);
		expect(isPresent('Gus')).toBe(true);
		expect(isPresent(null)).toBe(false);
	});
});
