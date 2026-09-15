import { jest } from '@jest/globals';
import Redis from 'ioredis';

// getStore() connects to a real Redis instance at the hardcoded "redis://redis"
// hostname, which only resolves inside this project's Docker network — the
// same assumption the app itself makes (server/redux/store.js), and the same
// one the whole "npm run dev" workflow already carries. These are therefore
// integration tests, not unit tests: they need `docker compose up` (or
// `docker compose run --service-ports --rm app bash` per the README) to pass.
//
// TABLE_TTL_SECONDS is read once at module load time, so it's overridden via
// process.env *before* dynamically importing the module, inside beforeAll —
// a static top-level import would already have locked in the real 7-day
// default before this file's own code got a chance to run.
const TEST_TTL_SECONDS = 2;
let getStore;
let verifyClient;
let consoleLogSpy;

let storeModuleRedisClient;

beforeAll(async () => {
	process.env.TABLE_TTL_SECONDS = String(TEST_TTL_SECONDS);
	const storeModule = await import('./store.js');
	getStore = storeModule.default;
	storeModuleRedisClient = storeModule.redisInstance;
	verifyClient = new Redis('redis://redis');
	// redux-logger is noisy by design; keep test output focused on assertions.
	consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(async () => {
	consoleLogSpy.mockRestore();
	// Both connections are module- or file-scoped singletons that outlive any
	// single test — without closing them, Jest hangs after the run instead of
	// exiting, because ioredis keeps its socket (and reconnect timers) alive.
	await verifyClient.quit();
	await storeModuleRedisClient.quit();
});

const testKey = (label) => `test-store-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

describe('getStore', () => {
	it('creates a real coinche INITIAL_STATE for a table that has never been played', async () => {
		const store = await getStore(testKey('fresh'));
		const present = store.getState().present;
		expect(present.players).toHaveLength(4);
		expect(present.hasGameStarted).toBe(false);
		expect(typeof present.gameId).toEqual('string');
	});

	it('persists every dispatched action to Redis under the table\'s key', async () => {
		const key = testKey('persist');
		const store = await getStore(key);
		store.dispatch({ type: 'JOIN', payload: { playerId: 'p0', playerName: 'Gus', socketId: 's0' } });

		// give the fire-and-forget redis SET a tick to land
		await new Promise(resolve => setTimeout(resolve, 50));

		const raw = await verifyClient.get(key);
		const persisted = JSON.parse(raw);
		expect(persisted.present.players[0].name).toEqual('Gus');

		await verifyClient.del(key);
	});

	it('picks up a table\'s existing state on a later call instead of starting over', async () => {
		const key = testKey('reload');
		const firstStore = await getStore(key);
		firstStore.dispatch({ type: 'JOIN', payload: { playerId: 'p0', playerName: 'Gus', socketId: 's0' } });
		await new Promise(resolve => setTimeout(resolve, 50));

		const secondStore = await getStore(key); // simulates the next player's request, or a server restart
		expect(secondStore.getState().present.players[0].name).toEqual('Gus');

		await verifyClient.del(key);
	});

	it('sets a sliding TTL on every write, so an active table never counts down to zero', async () => {
		const key = testKey('ttl-slides');
		const store = await getStore(key);
		store.dispatch({ type: 'JOIN', payload: { playerId: 'p0', playerName: 'Gus', socketId: 's0' } });
		await new Promise(resolve => setTimeout(resolve, 50));
		const ttlAfterFirstWrite = await verifyClient.ttl(key);
		expect(ttlAfterFirstWrite).toBeGreaterThan(0);
		expect(ttlAfterFirstWrite).toBeLessThanOrEqual(TEST_TTL_SECONDS);

		await new Promise(resolve => setTimeout(resolve, TEST_TTL_SECONDS * 1000 - 500));
		store.dispatch({ type: 'JOIN', payload: { playerId: 'p1', playerName: 'Kikoo', socketId: 's1' } });
		await new Promise(resolve => setTimeout(resolve, 50));
		const ttlAfterSecondWrite = await verifyClient.ttl(key);
		// If the TTL only ever counted down from the first write, it would be
		// under a second by now. A genuine activity dispatched just before that
		// deadline resets it back up near the full window.
		expect(ttlAfterSecondWrite).toBeGreaterThan(1);

		await verifyClient.del(key);
	}, 10000);

	it('actually expires a table nobody returns to', async () => {
		const key = testKey('expires');
		const store = await getStore(key);
		store.dispatch({ type: 'JOIN', payload: { playerId: 'p0', playerName: 'Gus', socketId: 's0' } });
		await new Promise(resolve => setTimeout(resolve, 50));
		expect(await verifyClient.get(key)).not.toBeNull();

		await new Promise(resolve => setTimeout(resolve, TEST_TTL_SECONDS * 1000 + 500));
		expect(await verifyClient.get(key)).toBeNull();
	}, 10000);
});
