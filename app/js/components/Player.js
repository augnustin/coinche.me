import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { SOUTH, NORTH } from "../../../shared/constants/positions";
import { pluralize } from "../../../shared/utils/string";
import { random } from "../../../shared/utils/array";
import { playCard, collect } from "../redux/actions/socketActions";
import {
  selectPlayerByPosition,
  selectCanCollect,
  selectActivePlayer,
  selectTricks,
  selectHasGameStarted,
} from "../redux/selectors/game";

import "../../scss/components/player.scss";
import HandSymbol from "url:../../images/hand2.svg";

import Hand from "./Hand.js";
// import Tricks from './Tricks.js';

const Player = ({ hasGameStarted, position, player, tricks, canCollect, collect, activePlayer, playCard }) => {
  if (!player) return null;
  const { name, isDealer, hand, id, index, disconnected } = player;

  const handleClick = (e) => {
    if (!id) playCard(random(hand));
  };

  const playerTricks = tricks.filter(({ playerIndex, _ }) => playerIndex === index);

  const $name = (
    <div className={`name ${disconnected ? "has-text-danger" : ""}`} title={disconnected ? "Déconnecté" : ""}>
      {player.index === activePlayer.index ? (
        <span className="icon">
          <img src={HandSymbol} />
        </span>
      ) : null}
      <span className={`${!id ? "clickable" : ""}`} onClick={handleClick}>
        {!id ? "BOT" : name} {isDealer ? "a distribué" : ""} ({pluralize(playerTricks.length, "pli")})
      </span>
      &nbsp;
      {!id && canCollect && (
        <button className="button is-small is-text is-rounded" onClick={(e) => collect(index)}>
          Ramasser
        </button>
      )}
    </div>
  );

  const isFirstPerson = position === SOUTH ? true : false;

  return (
    <div className={`player is-${position}`}>
      {position !== NORTH && $name}
      <Hand
        cards={hand}
        isSelectable={hasGameStarted && isFirstPerson}
        isHidden={!isFirstPerson}
        style={position === SOUTH ? "normal" : "compact"}
      />
      {position === NORTH && $name}
    </div>
  );
};

Player.propTypes = {
  position: PropTypes.string.isRequired,
  player: PropTypes.object.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  player: selectPlayerByPosition(state, ownProps.position),
  tricks: selectTricks(state),
  canCollect: selectCanCollect(state),
  activePlayer: selectActivePlayer(state),
  hasGameStarted: selectHasGameStarted(state),
});

const mapDispatchToProps = {
  playCard,
  collect,
};

export default connect(mapStateToProps, mapDispatchToProps)(Player);
