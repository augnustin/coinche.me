import React from 'react';
import {connect} from 'react-redux';
import { createStructuredSelector } from 'reselect';
import {
  selectTricksByTeam,
  selectPreferences,
} from '../redux/selectors/game';
import {distribute} from '../redux/actions/socketActions';
import options from '../../../shared/constants/options';

import ScoreBoard from './ScoreBoard';
import Card from './Card';

const TeamHand = ({tricks}) => {
  return (
    <div className="hand">
      {
        tricks.length
        ? tricks.map(({cards}) => cards.map(c => <Card key={c} value={c} />))
        : <p>Aucun pli :(</p>
      }
    </div>
  )
}

const Score = ({tricks, distribute, preferences}) => {
  const [us, others] = tricks;
  return (
    <div className="commands has-text-centered">
      {preferences.declarationMode !== options.NO_DECLARATION && <ScoreBoard />}
      <div className="row">
        <h2 className="title is-2">Nous</h2>
        <TeamHand tricks={us} />
      </div>
      <div className="row">
        <h2 className="title is-2">Eux</h2>
        <TeamHand tricks={others} />
      </div>
      <button className="button is-primary is-large" onClick={() => distribute()} style={{marginTop: '0rem'}}>Redistribuer</button>
    </div>
  );
};

const mapStateToProps = createStructuredSelector({
  tricks: selectTricksByTeam,
  preferences: selectPreferences,
})

const mapDispatchToProps = {
  distribute,
}

export default connect(mapStateToProps, mapDispatchToProps)(Score);