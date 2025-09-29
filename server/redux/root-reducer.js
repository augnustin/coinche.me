import { v4 as uuid } from 'uuid';
import actionTypes from './actionTypes.js';
import {DECK32} from '../constants/decks.js';
import {
  sortHand,
  distributeCoinche,
  cutDeck,
  countPlayerScore,
  hasBelote,
  gatherTricks,
} from '../utils/coinche.js';
import {
  NO_DECLARATION,
  FINAL_DECLARATION,
  DECLARATIONS,
} from '../../shared/constants/options.js';
import {shuffle, first, nextIndex, switchIndexes, firstIndex} from '../../shared/utils/array.js';
import {
  selectCurrentDeclaration,
  selectIsCoinched,
  selectCurrentTrumpType,
  selectTeams,
} from './selectors.js';

export const INITIAL_STATE = () => ({
  gameId: uuid(),
  hasGameStarted: false,
  declarationsHistory: [],
  tricks: [],
  players: Array(4).fill({
    name: null,
    id: null,
    hand: [],
    sockets: [],
    disconnected: false,
  }),
  preferences: {
    declarationMode: NO_DECLARATION,
  },
  score: [
    [0, 0],
  ],
});

const rootReducer = (state = INITIAL_STATE(), action) => {
  switch (action.type) {
    case actionTypes.RESET:
      return INITIAL_STATE();
    case actionTypes.JOIN:
      const {playerId, playerName, socketId} = action.payload;
      const samePlayerIndex = state.players.findIndex(p => p.id === playerId);
      const firstAvailableIndex = state.players.findIndex(p => !p.id);
      const firstDisconnectedIndex = state.players.findIndex(p => p.disconnected);
      const newPlayerIndex = firstIndex([samePlayerIndex, firstAvailableIndex, firstDisconnectedIndex]);
      if (newPlayerIndex === undefined) return state;
      return {
        ...state,
        players: state.players.map((p, i) => {
          if (newPlayerIndex === i) {
            return {
              ...p,
              id: playerId,
              name: playerName || p.name || `Joueur ${i+1}`,
              sockets: p.sockets.concat(socketId),
              disconnected: false,
            }
          } else {
            return p;
          }
        })
      }
    case actionTypes.LEAVE:
      return {
        ...state,
        players: state.players.map(p => {
          const filteredSockets = p.sockets.filter(s => s !== action.payload);
          return {
            ...p,
            sockets: filteredSockets,
            disconnected: p.id && filteredSockets.length === 0,
          }
        })
      }
    case actionTypes.SWITCH_TEAMS: {
      const [i1, i2] = action.payload.indexes;
      const i1PartnerIndex = state.players.findIndex((p, i) => {
        return i !== i1 && (i % 2) === (i1 % 2);
      });
      return {
        ...state,
        players: switchIndexes(state.players, i1PartnerIndex, i2),
      }
    };
    case actionTypes.SET_PREFERENCE: {
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        }
      }
    };
    case actionTypes.DISTRIBUTE: {
      const previousDealerIndex = state.players.findIndex(p => p.isDealer);
      const dealerIndex = firstIndex([action.payload.playerIndex, nextIndex(state.players, previousDealerIndex), 0]);

      const playersWithDealer = state.players.map((p, index) => ({
        ...p,
        hand: [],
        onTable: null,
        isDealer: index === dealerIndex,
        isActivePlayer: index === nextIndex(state.players, dealerIndex),
      }));
      const deck = cutDeck(state.tricks.length ? gatherTricks(state.tricks) : shuffle(DECK32));

      const score = action.payload.score ? state.score.concat([action.payload.score]) : state.score

      return {
        ...state,
        tricks: [],
        players: distributeCoinche(playersWithDealer, deck, dealerIndex),
        hasGameStarted: state.preferences.declarationMode === NO_DECLARATION,
        score,
      };
    };
    case actionTypes.PLAY_CARD: {
      const card = action.payload;
      const playingPlayerIndex = state.players.findIndex(p => p.hand.find(c => c === card));
      const activePlayerIndex = nextIndex(state.players, playingPlayerIndex);
      return {
        ...state,
        players: state.players.map((p, i) => {
          if (i === playingPlayerIndex) {
            return {
              ...p,
              hand: sortHand(p.hand.filter(c => c !== card).concat(p.onTable || []), selectCurrentTrumpType(state)),
              onTable: card,
              isActivePlayer: false,
            }
          } else {
            return {
              ...p,
              isActivePlayer: i === activePlayerIndex,
            }
          }
        }),
      }
    };
    case actionTypes.CARD_BACK: {
      const card = action.payload;
      const playingPlayerIndex = state.players.findIndex(p => p.onTable === card);

      return {
        ...state,
        players: state.players.map((p, i) => {
          if (i === playingPlayerIndex) {
            return {
              ...p,
              hand: sortHand(p.hand.concat(card), selectCurrentTrumpType(state)),
              onTable: null,
            }
          } else {
            return p;
          }
        }),
      }
    };
    case actionTypes.COLLECT: {
      const {playerIndex} = action.payload;

      const newTrick = {
        playerIndex,
        cards: state.players.map(p => p.onTable).filter(c => c),
      };
      console.log(newTrick)
      console.log(newTrick.cards)
      if (newTrick.cards.length < state.players.length) {
        return state;
      }
      return {
        ...state,
        tricks: [newTrick, ...state.tricks],
        players: state.players.map((p, i) => {
          return {
            ...p,
            isActivePlayer: i === playerIndex,
            onTable: null,
          }
        })
      }
    };
    case actionTypes.DECLARE: {
      const {playerIndex, trumpType, goal, type} = action.payload;
      const playersUpdated = state.players.map((p, i) => {
        return {
          ...p,
          isActivePlayer: (i === (playerIndex + 1) % state.players.length),
        }
      });

      return {
        ...state,
        players: playersUpdated,
        declarationsHistory: state.declarationsHistory.concat({
          playerIndex,
          trumpType,
          goal,
          type,
        }),
      };
    };
    case actionTypes.LAUNCH_GAME: {
      const dealerIndex = state.players.findIndex(p => p.isDealer);
      const trumpType = selectCurrentTrumpType(state);
      const playersUpdated = state.players.map((p,i) => {
        return {
          ...p,
          hand: sortHand(p.hand, trumpType),
          hasBelote: hasBelote(p.hand, trumpType),
          isActivePlayer: i === nextIndex(state.players, dealerIndex),
        }
      })

      return {
        ...state,
        players: playersUpdated,
        hasGameStarted: true,
      }
    };
    case actionTypes.FINAL_DECLARE: {
      return [actionTypes.DECLARE, actionTypes.LAUNCH_GAME].reduce((state, type) => rootReducer(state, {
        ...action,
        type,
      }), state)
    };
    case actionTypes.GET_SCORE: {
      const currentDeclaration = selectCurrentDeclaration(state);
      const allPlayerScore = countPlayerScore(state.tricks, currentDeclaration.trumpType);
      const isCoinched = selectIsCoinched(state);

      const updatedTeams = selectTeams(state).map( team => {
        team.currentGame = team.players.reduce((currentGame, playerId) => {
          const playerIndex = state.players.findIndex(p => p.id === playerId)
          const hasLastTen = (first(state.tricks).playerIndex === playerIndex);
          const playerScore = allPlayerScore[playerIndex] || 0;

          currentGame.gameScore = (currentGame.gameScore || 0) + playerScore;
          currentGame.hasBelote = (currentGame.hasBelote) || state.players[playerIndex].hasBelote;
          currentGame.hasLastTen = (currentGame.hasLastTen) || hasLastTen;
          currentGame.isBidderTeam = (currentGame.isBidderTeam) || (currentDeclaration.playerId === playerId);
          currentGame.isCoinched = (currentGame.isCoinched) || `${(isCoinched.length >= 2) ? 'Surcoinchée' : ((isCoinched.length === 1) ? 'Coinchée' : '')}`;
          return currentGame;
        }, {});

        const lastTen = team.currentGame.hasLastTen ? 10 : 0;
        const belote = team.currentGame.hasBelote ? 20 : 0;
        const coef = (isCoinched.length) ? isCoinched.length * 2 : 1;
        const preTotal = team.currentGame.gameScore + lastTen;

        if (team.currentGame.isBidderTeam) {
          if (preTotal < 82) {
            team.currentGame.gameTotal = belote;
          } else if ((currentDeclaration.goal === 250) && (preTotal === 162)) {
            team.currentGame.gameTotal = 250 * coef + belote;
          } else if ((preTotal + belote) >= currentDeclaration.goal) {
            team.currentGame.gameTotal = currentDeclaration.goal * coef + belote;
          } else if ((preTotal + belote) < currentDeclaration.goal) {
            team.currentGame.gameTotal =  belote;
          }
        } else {
          if (currentDeclaration.goal === 250) {
            if (preTotal !== 0) team.currentGame.gameTotal = 250 * coef + belote;
            else team.currentGame.gameTotal = belote;
          } else if (preTotal <= (162 - currentDeclaration.goal)) {
            team.currentGame.gameTotal = belote;
          } else {
            team.currentGame.gameTotal = 162 * coef + belote;
          }
        }
        return team;
      });

      return {
        ...state,
        teams: updatedTeams,
      }
    };
    default:
      return state;
  };
};

export default rootReducer;

