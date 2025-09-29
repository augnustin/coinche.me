import React, { useState, useEffect, createContext } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Navigate, useParams } from 'react-router-dom';
import { subscribeServerUpdate, unsubscribeServerUpdate } from '../redux/actions/socketActions';
import {selectGameId} from '../redux/selectors/game'
import Layout from '../components/Layout';
import Game from '../components/Game';
import {localStorageKeys} from '../constants';

const GamePage = ({gameId, subscribeServerUpdate, unsubscribeServerUpdate}) => {
  const { tableId } = useParams();
  if (!tableId) return (
    <Navigate to="/" replace />
  );
  const username = localStorage.getItem(localStorageKeys.USERNAME);
  if (!username) return (
    <Navigate to={`/?join=${tableId}`} replace />
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      unsubscribeServerUpdate(tableId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tableId, unsubscribeServerUpdate]);

  useEffect(() => {
    subscribeServerUpdate(tableId, username)
    // return () => {
    //   // unsubscribeServerUpdate(tableId);
    // }
  }, [gameId]);

  return (
    <Layout>
      <Game />
    </Layout>
  );
};

const mapStateToProps = createStructuredSelector({
  gameId: selectGameId,
});


const mapDispatchToProps = {
  subscribeServerUpdate,
  unsubscribeServerUpdate
}

export default connect(mapStateToProps, mapDispatchToProps)(GamePage);