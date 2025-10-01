import get from 'lodash.get';
import { createSelector } from 'reselect';
import {SOUTH} from '../../../../shared/constants/positions';
import {last, partition} from '../../../../shared/utils/array';
import {equals} from '../../../../shared/utils/player';
import declarationTypes from '../../../../shared/constants/declarationTypes';

export const selectGameId = state => get(state, 'game.gameId');
export const selectTableId = state => get(state, 'game.tableId');
export const selectPlayers = state => get(state, 'game.players', []);
export const selectTricks = state => get(state, 'game.tricks', []);
export const selectDeclarationsHistory = state => get(state, 'game.declarationsHistory', []);
export const selectHasGameStarted = state => get(state, 'game.hasGameStarted');
export const selectScore = state => get(state, 'game.score', []);
export const selectPreferences = state => get(state, 'game.preferences', {});

export const selectNbPlayers = createSelector(
  [selectPlayers],
  (players) => players.length,
);

export const selectHumanPlayers = createSelector(
  [selectPlayers],
  players => players.filter(p => p.id)
);

export const selectPlayerByPosition = createSelector(
  [selectPlayers, (state, position) => position],
  (players, position) => players.find(player => player.position === position)
)

export const selectCurrentPlayer = createSelector(
  [selectPlayers],
  (players) => players.find(player => player.position === SOUTH)
);

export const selectActivePlayer = createSelector(
  [selectPlayers],
  players => players.find(p => p.isActivePlayer),
);

export const selectIsActivePlayer = createSelector(
  [selectCurrentPlayer, selectActivePlayer],
  (currentPlayer, activePlayer) => equals(currentPlayer, activePlayer),
);

export const selectIsDistributed = createSelector(
  [selectPlayers],
  players => players.filter(p => ((p.hand || []).length)).length
);

export const selectIsLastTrick = createSelector(
  [selectPlayers],
  (players) => players.every(p => p.hand.length === 0 && !p.onTable),
);

export const selectOnTable = createSelector(
  [selectPlayers],
  players => {
    const playersOnTable = players.filter(p => p.onTable);
    return playersOnTable.map(p => ({value: p.onTable, position: p.position}));
  }
);

export const selectCanCollect = createSelector(
  [selectPlayers, selectOnTable],
  (players, onTable) => onTable.length === players.length,
);

export const selectLastTrick = createSelector(
  [selectTricks],
  (tricks) => tricks[0],
);

export const selectTeams = createSelector(
  [selectPlayers],
  players => {
    const playerIds = players.map(p => p.id);
    return partition(playerIds, (p, i) => i%2);
  }
)

export const selectTricksByTeam = createSelector(
  [selectTricks, selectCurrentPlayer],
  (tricks, currentPlayer) => {
    if (!currentPlayer) return [[], []];
    
    const us = [];
    const others = [];
    
    tricks.forEach(t => {
      const isCurrentPlayerTeam = (t.playerIndex % 2) === (currentPlayer.index % 2);
      if (isCurrentPlayerTeam) {
        us.push(t);
      } else {
        others.push(t);
      }
    });
    
    return [us, others];
  }
)

export const selectPartner = createSelector(
  [selectPlayers, selectCurrentPlayer],
  (players, currentPlayer) => players.find(p => p.index !== currentPlayer.index && (p.index % 2) === (currentPlayer.index % 2))
);

export const selectCurrentDeclaration = createSelector(
  [selectDeclarationsHistory],
  (declarationsHistory) => {
    const validDeclarations = declarationsHistory.filter(d => (d.type !== declarationTypes.PASS) && (d.type !== declarationTypes.COINCHE));
    return last(validDeclarations);
  }
)

export const selectIsCoinched = createSelector(
	[selectDeclarationsHistory],
	(declarationsHistory) => declarationsHistory.filter(d => d.type === declarationTypes.COINCHE)
);
