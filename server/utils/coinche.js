import { DECK32 } from '../constants/decks.js';
import trumpTypes from '../../shared/constants/trumpTypes.js';
import gameScore from '../constants/gameScore.js';
import { next, shift, randomIndex, shuffle } from '../../shared/utils/array.js';

export const sortHand = (hand, trumpType) => {

  const sortingFunction = sortByType(trumpType || trumpTypes.NO_TRUMP);

  const sortedSpades = hand.filter(c => c.includes('S')).sort(sortingFunction);
  const sortedHearts = hand.filter(c => c.includes('H')).sort(sortingFunction);
  const sortedClubs = hand.filter(c => c.includes('C')).sort(sortingFunction);
  const sortedDiamonds = hand.filter(c => c.includes('D')).sort(sortingFunction);

  return [].concat(sortedSpades).concat(sortedHearts).concat(sortedClubs).concat(sortedDiamonds);
};

export const gatherTricks = tricks => tricks.reduce((a, t) => {
  return a.concat(shuffle(t.cards));
}, []);

export const cutDeck = cards => shift(cards, randomIndex(cards))

export const distributeCoinche = (players, deck, dealerIndex) => {
  if (deck.length !== 32) return players;

  const newDeck = cutDeck(deck);
  let playersWithCards = distribute(newDeck.slice(0, 12), players, dealerIndex, 3);
  playersWithCards = distribute(newDeck.slice(12, 20), playersWithCards, dealerIndex, 2);
  playersWithCards = distribute(newDeck.slice(20, 32), playersWithCards, dealerIndex, 3);

  return playersWithCards;
};

export const distribute = (deck, players, dealerIndex, nbCardsToDistribute=1) => {

  let nextPlayerIndex = dealerIndex;
  const playersWithCards = deck.reduce((players, card, deckIndex) => {
    const nextPlayer = (nbCardsToDistribute === 1) || (deckIndex % nbCardsToDistribute === 0);
    if (nextPlayer) {
      nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
    }

    return players.map((player, playerIndex) => {
      if (nextPlayerIndex === playerIndex) {
        return {
          ...player,
          hand: player.hand.concat(card)
        }
      } else {
        return player;
      }
    })
  }, players);

  return playersWithCards.map(player => {
      return {
        ...player,
        hand: sortHand(player.hand),
      };
  });
};

export const countTrick = (trick, trumpType) => {
  return trick.reduce((score, card) => {
    const color = card.slice(card.length - 1)
    const value = card.substring(0, card.length - 1);
    if (trumpType === trumpTypes.ALL_TRUMP) {
      return score += gameScore.allTrumpScore[value];
    } else if (trumpType === trumpTypes.NO_TRUMP) {
      return score += gameScore.noTrumpScore[value];
    } else {
      const scoreType = (color === trumpType) ? 'trumpScore' : 'defaultScore';
      return score += gameScore[scoreType][value];
    }
  }, 0)
};

export const countPlayerScore = (tricks, trumpType) => {
  if (!Object.keys(trumpType).length) return {};
  return tricks.reduce((scoreList, trick) => {
    const currentScore = scoreList[trick.playerIndex] || 0;
    scoreList[trick.playerIndex] = currentScore + countTrick(trick.cards, trumpType);
    return scoreList;
  }, {});
};

export const sortByType = (trumpType) => {
  return (firstCard, secondCard) => {
    const firstCardColor = firstCard.slice(firstCard.length - 1)
    const firstCardValue = firstCard.substring(0, firstCard.length - 1);
    const secondCardColor = secondCard.slice(secondCard.length - 1)
    const secondCardValue = secondCard.substring(0, secondCard.length - 1);

    if (trumpType === trumpTypes.ALL_TRUMP) {
      return  gameScore.allTrumpScore[secondCardValue] - gameScore.allTrumpScore[firstCardValue];
    } else if (trumpType === trumpTypes.NO_TRUMP) {
      return gameScore.noTrumpScore[secondCardValue] - gameScore.noTrumpScore[firstCardValue];
    } else {
      const firstCardScoreType = (firstCardColor === trumpType) ? 'trumpScore' : 'defaultScore';
      const secondCardScoreType = (secondCardColor === trumpType) ? 'trumpScore' : 'defaultScore';
      return gameScore[secondCardScoreType][secondCardValue] - gameScore[firstCardScoreType][firstCardValue] ;
    }
  }
};

export const hasBelote = (hand=[], trumpType='') => {
  if ((trumpType === trumpTypes.NO_TRUMP) || (trumpType === trumpTypes.ALL_TRUMP)) return false;

  const king = "K" + trumpType;
  const queen = "Q" + trumpType;
  return hand.includes(king) && hand.includes(queen);
};