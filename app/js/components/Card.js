import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { playCard, getCardBack } from '../redux/actions/socketActions';
import { selectOnTable, selectIsActivePlayer } from '../redux/selectors/game';
import PropTypes from 'prop-types';
import {localStorageKeys} from '../constants';

import '../../scss/components/card.scss';

import images from '../utils/cardImages';

const Card = ({value, onTable, isActivePlayer, isHidden, isSelectable, playCard, getCardBack}) => {
  const image = isHidden ? images['BLUE_BACK'] : images[value];

  const handleClick = (e) => {
    if (!isSelectable) return;
    const cardValue = value;
    if (isActivePlayer || !localStorage.getItem(localStorageKeys.WARN_NOT_ACTIVE_USER) || window.confirm("Ce n'est pas votre tour !")) {
      (onTable.find(({value}) => value === cardValue)) ? getCardBack(value) : playCard(value);
    };
  }

  return (
    <div className="card-wrapper">
      {image ? <img onClick={e => handleClick(event)} className={`playing-card ${isSelectable ? 'is-selectable' : ''}`} src={image} /> : <p>Carte inconnue</p>}
    </div>
  )
}

Card.propTypes = {
  isHidden: PropTypes.bool,
  isSelectable: PropTypes.bool,
  value: PropTypes.string.isRequired,
  playCard: PropTypes.func.isRequired,
}

const mapStateToProps = createStructuredSelector({
  onTable: selectOnTable,
  isActivePlayer: selectIsActivePlayer,
})

const mapDispatchToProps = {
  playCard,
  getCardBack,
}

export default connect(mapStateToProps, mapDispatchToProps)(Card);