import React, { useState, useEffect, createContext } from 'react';
import { connect } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { subscribeServerUpdate, unsubscribeServerUpdate } from '../redux/actions/socketActions';
import Layout from '../components/Layout';
import Game from '../components/Game';
import {localStorageKeys} from '../constants';

const GamePage = ({subscribeServerUpdate, unsubscribeServerUpdate}) => {
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
  }, [tableId, username]);

  return (
    <Layout>
      <Game />
    </Layout>
  );
};

const mapDispatchToProps = {
  subscribeServerUpdate,
  unsubscribeServerUpdate
}

export default connect(null, mapDispatchToProps)(GamePage);