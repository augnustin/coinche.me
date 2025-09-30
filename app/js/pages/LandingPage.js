import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {localStorageKeys, queryParamToJoin} from '../constants';
import {selectTableId} from '../redux/selectors/game'

const LandingPage = ({tableId: currentTableId}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isJoiningTableId = new URLSearchParams(location.search).get(queryParamToJoin);

  const [username, setUsername] = useState(localStorage.getItem(localStorageKeys.USERNAME) || '');
  const [mayNeedHelp, _setMayNeedHelp] = useState(!username && !isJoiningTableId);
  const [tableId, setTableId] = useState(isJoiningTableId || currentTableId || '');

  const setUsernameAndSave = value => {
    setUsername(value);
    localStorage.setItem(localStorageKeys.USERNAME, value);
  };

  const joinTable = (e) => {
    e.preventDefault();
    fetch(`/join`, {
      method: 'post',
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: `tableId=${tableId}`,
    })
    .then(res => {
      navigate(res.url.replace(`${window.location.protocol}//${window.location.host}`, ''));
    })
  };

  const tableInput = text => (
    <div key="join">
      {text && <p className="field">{text}</p>}
      <div className="field has-addons">
        <div className="control is-expanded">
          <input className="input" type="text" placeholder="Entrez un nom de table ..." value={tableId} onChange={(e) => setTableId(e.target.value)} />
        </div>
        <div className="control">
          <button className="button is-primary">
            Rejoindre
          </button>
        </div>
      </div>
    </div>
  )

  const createNewTable = label => (
    <button key="button" className="button is-primary is-large">{label}</button>
  )

  const orAction = (
    <p key="or" className="section is-vertical has-text-centered">- OU -</p>
  )

  const possibleActions = () => {
    if (isJoiningTableId) return tableInput('On t\'attend pour jouer sur cette table :');
    return (currentTableId ? [
      tableInput('Reprendre ta partie en cours :'),
      orAction,
      createNewTable("Créer une nouvelle table"),
    ] : [
      createNewTable("Créer une table"),
      orAction,
      tableInput(),
    ])
  }

  return (
    <Layout mode="container">
      <form className="has-text-centered" action="/join" method="post" onSubmit={e => joinTable(e)}>
        <div className="section is-vertical">
          <h1 className="title is-1">Bienvenue</h1>
          <p className="subtitle">Ici les cartes n'ont pas le COVID</p>
          {mayNeedHelp && (
            <p>
              <Link className="button is-primary" to="/help">Comment ça marche ?</Link>
            </p>
          )}
        </div>
        <div className="section is-vertical">
          <div className="field">
            <input style={{maxWidth: '300px'}} className="input is-large" type="text" placeholder="Choisissez votre pseudo" maxLength="20" value={username} onChange={e => setUsernameAndSave(e.target.value)} required />
          </div>
        </div>
        <div className="section is-vertical">
          {possibleActions()}
        </div>
      </form>
    </Layout>
  );
};

// export default LandingPage;


const mapStateToProps = createStructuredSelector({
  tableId: selectTableId,
});

export default connect(mapStateToProps)(LandingPage);