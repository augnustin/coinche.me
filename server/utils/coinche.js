import { DECK32 } from '../constants/decks';
import trumpTypes from '../../shared/constants/trumpTypes';
import gameScore from '../constants/gameScore';


export const sortHand = (hand) => {
  const sortedSpades = hand.filter(c => c.includes('S')).sort();
  const sortedHearts = hand.filter(c => c.includes('H')).sort();
  const sortedClubs = hand.filter(c => c.includes('C')).sort();
  const sortedDiamonds = hand.filter(c => c.includes('D')).sort();

  return [].concat(sortedSpades).concat(sortedHearts).concat(sortedClubs).concat(sortedDiamonds);
}

export const distributeCoinche = (deck, players, dealerIndex) => {
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

export const cutDeck = (deck) => {
  const indexToCut = Math.floor(Math.random() * 24) + 4; //returns an integer betwenn 4 and 28
  const copiedDeck = [...deck];
  return [...deck.slice(indexToCut + 1, deck.length), ...deck.slice(0, indexToCut + 1)];
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
      const scoreType = (color === trumpType) ? 'trumpScore' : 'defaultScore' ;
      return score += gameScore[scoreType][value];
    }
  }, 0)
};

export const countPlayerScore = (tricks, lastDeclaration={}) => {
  if (!lastDeclaration.content) return {};
  const {goal, trumpType} = lastDeclaration.content;

  return tricks.reduce((scoreList, trick) => {
    const currentScore = scoreList[trick.playerIndex] || 0;
    scoreList[trick.playerIndex] = currentScore + countTrick(trick.cards, trumpType);
    return scoreList;
  }, {});
};