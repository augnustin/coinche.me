import { jest } from '@jest/globals';
import { emitEachInRoom } from './sockets.js';

// This is the exact function that broke in production earlier: it used to
// call io.to(roomId).clients((error, clients) => ...), the Socket.IO v1/v2
// callback API, against a v4 server where that method no longer exists at
// all. These tests pin the v4 shape (io.in(roomId).fetchSockets()) so a
// future dependency bump can't silently reintroduce the same class of break.

const buildMockSocket = (id) => ({ id, emit: jest.fn() });

describe('emitEachInRoom', () => {
	it('asks the v4 Socket.IO API for the room\'s sockets, not the old v1/v2 callback API', async () => {
		const sockets = [buildMockSocket('sock-a'), buildMockSocket('sock-b')];
		const fetchSockets = jest.fn().mockResolvedValue(sockets);
		const io = { in: jest.fn().mockReturnValue({ fetchSockets }) };

		await emitEachInRoom(io, 'table-1', 'updated_state', () => ({}));

		expect(io.in).toHaveBeenCalledWith('table-1');
		expect(fetchSockets).toHaveBeenCalled();
	});

	it('emits to every socket currently in the room, each with its own per-socket payload', async () => {
		const sockets = [buildMockSocket('sock-a'), buildMockSocket('sock-b')];
		const io = { in: () => ({ fetchSockets: jest.fn().mockResolvedValue(sockets) }) };
		const getData = jest.fn(socketId => ({ tailoredFor: socketId }));

		await emitEachInRoom(io, 'table-1', 'updated_state', getData);

		expect(sockets[0].emit).toHaveBeenCalledWith('updated_state', { tailoredFor: 'sock-a' });
		expect(sockets[1].emit).toHaveBeenCalledWith('updated_state', { tailoredFor: 'sock-b' });
	});

	it('emits to nobody, without throwing, when the room is empty', async () => {
		const io = { in: () => ({ fetchSockets: jest.fn().mockResolvedValue([]) }) };
		await expect(emitEachInRoom(io, 'empty-table', 'updated_state', () => ({}))).resolves.toBeUndefined();
	});

	it('swallows a transport-level failure instead of crashing the dispatch that triggered it', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		const io = { in: () => ({ fetchSockets: jest.fn().mockRejectedValue(new Error('adapter unavailable')) }) };
		await expect(emitEachInRoom(io, 'table-1', 'updated_state', () => ({}))).resolves.toBeUndefined();
		console.error.mockRestore();
	});
});
