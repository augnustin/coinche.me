import rootReducer, { INITIAL_STATE } from './root-reducer.js';
import actionTypes from './actionTypes.js';
import declarationTypes from '../../shared/constants/declarationTypes.js';
import { NO_DECLARATION, DECLARATIONS } from '../../shared/constants/options.js';
import { DECK32 } from '../constants/decks.js';

// These tests drive the *real* reducer through the same action sequences the
// server actually receives from the client (see server/index.js), rather
// than calling coinche.js's pure helpers directly — that's what "game state
// evolution" means here: does a realistic run of actions leave the table in
// a consistent state, seat to seat and turn to turn.

const join = (playerId, playerName, socketId) => ({
	type: actionTypes.JOIN,
	payload: { playerId, playerName, socketId },
});

const joinFourPlayers = (state) => {
	return ['Gus', 'Kikoo', 'Bibi', 'Tof'].reduce((s, name, i) => {
		return rootReducer(s, join(`player-${i}`, name, `socket-${i}`));
	}, state);
};

const activePlayerIndex = (state) => state.players.findIndex(p => p.isActivePlayer);

describe('JOIN', () => {
	it('seats players in order, starting at seat 0', () => {
		const state = joinFourPlayers(INITIAL_STATE());
		expect(state.players.map(p => p.name)).toEqual(['Gus', 'Kikoo', 'Bibi', 'Tof']);
		expect(state.players.every(p => p.id)).toBe(true);
	});

	it('is a no-op once all four seats are taken', () => {
		const full = joinFourPlayers(INITIAL_STATE());
		const afterFifth = rootReducer(full, join('player-4', 'Late Larry', 'socket-4'));
		expect(afterFifth).toBe(full); // same reference: reducer returned state unchanged
	});

	it('reseats the same playerId at the same spot on reconnect, adding the new socket', () => {
		const state = joinFourPlayers(INITIAL_STATE());
		const reconnected = rootReducer(state, join('player-0', 'Gus', 'socket-0-tab2'));
		expect(reconnected.players[0].sockets).toEqual(['socket-0', 'socket-0-tab2']);
		expect(reconnected.players[0].name).toEqual('Gus');
	});

	it('gives a disconnected seat back to a new player once it is empty of sockets', () => {
		const state = joinFourPlayers(INITIAL_STATE());
		const afterLeave = rootReducer(state, { type: actionTypes.LEAVE, payload: 'socket-1' });
		expect(afterLeave.players[1].disconnected).toBe(true);

		const replaced = rootReducer(afterLeave, join('player-new', 'Newcomer', 'socket-new'));
		expect(replaced.players[1].id).toEqual('player-new');
		expect(replaced.players[1].disconnected).toBe(false);
	});

	it('names an anonymous joiner by seat number when no username was sent', () => {
		const state = rootReducer(INITIAL_STATE(), join('player-0', undefined, 'socket-0'));
		expect(state.players[0].name).toEqual('Joueur 1');
	});
});

describe('LEAVE', () => {
	it('only marks a seat disconnected once every one of its sockets is gone', () => {
		const oneSocket = joinFourPlayers(INITIAL_STATE());
		const twoTabs = rootReducer(oneSocket, join('player-0', 'Gus', 'socket-0-tab2'));

		const afterFirstTabCloses = rootReducer(twoTabs, { type: actionTypes.LEAVE, payload: 'socket-0' });
		expect(afterFirstTabCloses.players[0].disconnected).toBe(false);
		expect(afterFirstTabCloses.players[0].sockets).toEqual(['socket-0-tab2']);

		const afterSecondTabCloses = rootReducer(afterFirstTabCloses, { type: actionTypes.LEAVE, payload: 'socket-0-tab2' });
		expect(afterSecondTabCloses.players[0].disconnected).toBe(true);
	});

	it('never marks an empty, never-joined seat as disconnected', () => {
		const state = rootReducer(INITIAL_STATE(), { type: actionTypes.LEAVE, payload: 'some-random-socket' });
		expect(state.players.every(p => !p.disconnected)).toBe(true);
	});
});

describe('DISTRIBUTE', () => {
	it('deals all 32 cards, 8 per seat, with nothing lost or duplicated', () => {
		const joined = joinFourPlayers(INITIAL_STATE());
		const dealt = rootReducer(joined, { type: actionTypes.DISTRIBUTE, payload: {} });

		dealt.players.forEach(p => expect(p.hand.length).toEqual(8));
		const allCards = dealt.players.flatMap(p => p.hand).slice().sort();
		expect(allCards).toEqual(DECK32.slice().sort());
	});

	it('makes the dealt-to player after the dealer the active player', () => {
		const joined = joinFourPlayers(INITIAL_STATE());
		const dealt = rootReducer(joined, { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 2 } });

		expect(dealt.players[2].isDealer).toBe(true);
		expect(dealt.players[3].isActivePlayer).toBe(true);
	});

	it('rotates the deal to the next seat on a redeal when no explicit dealer is given', () => {
		const joined = joinFourPlayers(INITIAL_STATE());
		const firstDeal = rootReducer(joined, { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const secondDeal = rootReducer(firstDeal, { type: actionTypes.DISTRIBUTE, payload: {} });

		expect(secondDeal.players[1].isDealer).toBe(true);
	});

	it('starts the game immediately when playing without formal declarations', () => {
		const joined = joinFourPlayers(INITIAL_STATE());
		expect(joined.preferences.declarationMode).toEqual(NO_DECLARATION);
		const dealt = rootReducer(joined, { type: actionTypes.DISTRIBUTE, payload: {} });
		expect(dealt.hasGameStarted).toBe(true);
	});

	it('waits for LAUNCH_GAME when the table plays with declarations', () => {
		const withDeclarations = rootReducer(
			joinFourPlayers(INITIAL_STATE()),
			{ type: actionTypes.SET_PREFERENCE, payload: { declarationMode: DECLARATIONS } }
		);
		const dealt = rootReducer(withDeclarations, { type: actionTypes.DISTRIBUTE, payload: {} });
		expect(dealt.hasGameStarted).toBe(false);
	});

	it('reshuffles cards already played (a redeal) instead of drawing a fresh deck mid-hand', () => {
		// distributeCoinche only proceeds on an exact 32-card deck (see its own
		// test in coinche.test.js), so a redeal only kicks in once a full
		// hand's worth of tricks has actually been played out. Fabricate that
		// via 8 made-up 4-card tricks covering the real DECK32 cards.
		const joined = joinFourPlayers(INITIAL_STATE());
		const fakeTricks = Array.from({ length: 8 }, (_, i) => ({
			playerIndex: 0,
			cards: DECK32.slice(i * 4, i * 4 + 4),
		}));
		const midHand = { ...joined, tricks: fakeTricks };

		const redealt = rootReducer(midHand, { type: actionTypes.DISTRIBUTE, payload: {} });
		const allCards = redealt.players.flatMap(p => p.hand).slice().sort();
		expect(allCards).toEqual(DECK32.slice().sort());
		expect(redealt.tricks).toEqual([]); // the old hand's tricks are consumed, not carried over
	});
});

describe('SET_PREFERENCE', () => {
	it('merges into existing preferences instead of replacing them', () => {
		const state = rootReducer(INITIAL_STATE(), {
			type: actionTypes.SET_PREFERENCE,
			payload: { declarationMode: DECLARATIONS },
		});
		const withMore = rootReducer(state, {
			type: actionTypes.SET_PREFERENCE,
			payload: { someOtherFlag: true },
		});
		expect(withMore.preferences).toEqual({ declarationMode: DECLARATIONS, someOtherFlag: true });
	});
});

describe('a full trick: PLAY_CARD then COLLECT', () => {
	it('moves a card from hand to the table and hands the turn to the next seat', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const active = activePlayerIndex(dealt); // seat 1, per DISTRIBUTE's own contract
		const card = dealt.players[active].hand[0];

		const afterPlay = rootReducer(dealt, { type: actionTypes.PLAY_CARD, payload: card });

		expect(afterPlay.players[active].hand).not.toContain(card);
		expect(afterPlay.players[active].hand.length).toEqual(7);
		expect(afterPlay.players[active].onTable).toEqual(card);
		expect(afterPlay.players[active].isActivePlayer).toBe(false);
		expect(afterPlay.players[(active + 1) % 4].isActivePlayer).toBe(true);
	});

	it('refuses to collect a trick until all four seats have played', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const card = dealt.players[activePlayerIndex(dealt)].hand[0];
		const onePlayed = rootReducer(dealt, { type: actionTypes.PLAY_CARD, payload: card });

		const collected = rootReducer(onePlayed, { type: actionTypes.COLLECT, payload: { playerIndex: 0 } });
		expect(collected).toBe(onePlayed); // unchanged: COLLECT is a no-op with < 4 cards down
	});

	it('gathers all four cards into one trick and clears the table once everyone has played', () => {
		let state = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		for (let i = 0; i < 4; i++) {
			const active = activePlayerIndex(state);
			const card = state.players[active].hand[0];
			state = rootReducer(state, { type: actionTypes.PLAY_CARD, payload: card });
		}
		expect(state.players.every(p => p.onTable)).toBe(true);

		const collected = rootReducer(state, { type: actionTypes.COLLECT, payload: { playerIndex: 2 } });
		expect(collected.tricks.length).toEqual(1);
		expect(collected.tricks[0].cards.length).toEqual(4);
		expect(collected.players.every(p => !p.onTable)).toBe(true);
		expect(collected.players[2].isActivePlayer).toBe(true);
		collected.players.forEach(p => expect(p.hand.length).toEqual(7));
	});
});

describe('CARD_BACK', () => {
	it('undoes a play: the card returns to the hand it came from and the table clears', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const active = activePlayerIndex(dealt);
		const card = dealt.players[active].hand[0];
		const played = rootReducer(dealt, { type: actionTypes.PLAY_CARD, payload: card });

		const takenBack = rootReducer(played, { type: actionTypes.CARD_BACK, payload: card });
		expect(takenBack.players[active].onTable).toBeNull();
		expect(takenBack.players[active].hand).toContain(card);
		expect(takenBack.players[active].hand.length).toEqual(8);
	});
});

describe('DECLARE, LAUNCH_GAME and FINAL_DECLARE', () => {
	it('records a declaration and passes the turn to the next seat', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const declared = rootReducer(dealt, {
			type: actionTypes.DECLARE,
			payload: { playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE },
		});
		expect(declared.declarationsHistory).toEqual([{ playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE }]);
		expect(declared.players[2].isActivePlayer).toBe(true);
	});

	it('LAUNCH_GAME sorts every hand by the declared trump and starts the game', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const declared = rootReducer(dealt, {
			type: actionTypes.DECLARE,
			payload: { playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE },
		});
		const launched = rootReducer(declared, { type: actionTypes.LAUNCH_GAME, payload: {} });

		expect(launched.hasGameStarted).toBe(true);
		expect(launched.players[1].isActivePlayer).toBe(true); // back to the seat after the dealer
	});

	it('FINAL_DECLARE does DECLARE and LAUNCH_GAME as one atomic step', () => {
		const dealt = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		const viaTwoSteps = rootReducer(
			rootReducer(dealt, { type: actionTypes.DECLARE, payload: { playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE } }),
			{ type: actionTypes.LAUNCH_GAME, payload: {} }
		);
		const viaFinalDeclare = rootReducer(dealt, {
			type: actionTypes.FINAL_DECLARE,
			payload: { playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE },
		});
		expect(viaFinalDeclare).toEqual(viaTwoSteps);
	});
});

describe('SWITCH_TEAMS', () => {
	it('swaps the chosen seat with the requester\'s current partner', () => {
		const joined = joinFourPlayers(INITIAL_STATE());
		// seats 0 & 2 are partners, as are 1 & 3 (partition by index % 2)
		const switched = rootReducer(joined, { type: actionTypes.SWITCH_TEAMS, payload: { indexes: [0, 3] } });
		// seat 0's partner (seat 2) and seat 3 swap places
		expect(switched.players[2].name).toEqual('Tof');
		expect(switched.players[3].name).toEqual('Bibi');
		expect(switched.players[0].name).toEqual('Gus'); // untouched
		expect(switched.players[1].name).toEqual('Kikoo'); // untouched
	});
});

describe('RESET', () => {
	it('wipes the table back to a brand new game, dropping every player', () => {
		const played = joinFourPlayers(INITIAL_STATE());
		const reset = rootReducer(played, { type: actionTypes.RESET });

		expect(reset.players.every(p => !p.id)).toBe(true);
		expect(reset.gameId).not.toEqual(played.gameId);
	});
});

describe('a complete hand end to end: deal -> declare -> play every trick -> score', () => {
	it('produces a scored result for both teams once all 8 tricks are collected', () => {
		let state = rootReducer(joinFourPlayers(INITIAL_STATE()), { type: actionTypes.DISTRIBUTE, payload: { playerIndex: 0 } });
		state = rootReducer(state, {
			type: actionTypes.FINAL_DECLARE,
			payload: { playerIndex: 1, trumpType: 'H', goal: 80, type: declarationTypes.DECLARE },
		});

		for (let trick = 0; trick < 8; trick++) {
			for (let play = 0; play < 4; play++) {
				const active = activePlayerIndex(state);
				const card = state.players[active].hand[0];
				state = rootReducer(state, { type: actionTypes.PLAY_CARD, payload: card });
			}
			// Who actually won each trick is a game-rule question already covered
			// by countTrick/sortByType in coinche.test.js — here we only need a
			// legal seat to hand the trick to, to keep driving state forward.
			state = rootReducer(state, { type: actionTypes.COLLECT, payload: { playerIndex: activePlayerIndex(state) } });
		}

		expect(state.tricks.length).toEqual(8);
		expect(state.players.every(p => p.hand.length === 0)).toBe(true);

		const scored = rootReducer(state, { type: actionTypes.GET_SCORE, payload: {} });
		expect(scored.teams).toHaveLength(2);
		scored.teams.forEach(team => {
			expect(typeof team.currentGame.gameTotal).toEqual('number');
			expect(team.currentGame.gameScore).toBeGreaterThanOrEqual(0);
		});
		// The 32-card deck is worth 152 card points with hearts as trump (see
		// countTrick(DECK32, trumpTypes.H) in coinche.test.js) split between
		// the two teams; the traditional 162 only appears once the separate
		// 10-point "last trick" bonus is folded into a team's gameTotal.
		const totalPoints = scored.teams.reduce((sum, t) => sum + t.currentGame.gameScore, 0);
		expect(totalPoints).toEqual(152);
	});
});
