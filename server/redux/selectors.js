import get from 'lodash.get';
import { createSelector } from 'reselect';
import declarationTypes from '../../shared/constants/declarationTypes';
import {last, partition} from '../../shared/utils/array';

const selectDeclarationHistory = state => state.declarationsHistory;
const selectPlayers = state => state.players;

export const selectCurrentDeclaration = createSelector(
  [selectDeclarationHistory],
  (declarationsHistory) => last(declarationsHistory.filter(d => (d.type !== declarationTypes.PASS) && (d.type !== declarationTypes.COINCHE)))
)

export const selectCurrentTrumpType = createSelector(
  [selectCurrentDeclaration],
  currentDeclaration => get(currentDeclaration, 'trumpType')
)

export const selectIsCoinched = createSelector(
	[selectDeclarationHistory],
	(declarationsHistory) => declarationsHistory.filter(d => d.type === declarationTypes.COINCHE),
);

export const selectTeams = createSelector(
  [selectPlayers],
  players => partition(players.map(p => p.id), (p, i) => i%2).map(players => ({players}))
)