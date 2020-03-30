import React, { Component, useContext } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {SOUTH, NORTH} from '../../../shared/constants/positions';
import {pluralize} from '../../../shared/utils/string';
import {random} from '../../../shared/utils/array';
import { playCard } from '../redux/actions';
import {TableIdContext} from '../pages/GamePage';

import '../../scss/components/player.scss';

import Hand from './Hand.js';
// import Tricks from './Tricks.js';

const Player = ({position, player, playRandomCard}) => {

  const tableId = useContext(TableIdContext);

  if (!player) return null;
  const { name,
          isDealer,
          hand,
          tricks,
          isVirtual,
          id
        } = player;

  const handleClick = (e) => {
    if (!id) playRandomCard(tableId, hand)
    return;
  }

  const $name = <p onClick={handleClick} className="name">{!id ? 'BOT' : name} {isDealer ? 'a distribué' : ''} ({pluralize(tricks.length, 'pli')})</p>;

  const isFirstPerson = (position === SOUTH) ? true : false;

  return (
    <div className={`player is-${position}`}>
      {position !== NORTH && $name}
      <Hand cards={hand} isSelectable={isFirstPerson} isHidden={!isFirstPerson} style={position === SOUTH ? "normal" : "compact"} />
      {position === NORTH && $name}
    </div>
  );
}

Player.propTypes = {
  position: PropTypes.string.isRequired,
  player: PropTypes.object.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
  player: state.players.find(p => (p.position === ownProps.position)),
});

const mapDispatchToProps = (dispatch) => ({
  playRandomCard: (tableId, hand) => dispatch(playCard(tableId, random(hand))),
})

export default connect(mapStateToProps, mapDispatchToProps)(Player);

