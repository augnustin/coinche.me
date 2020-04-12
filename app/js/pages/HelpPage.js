import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

import mdContent from '../content/help.md'

const ConfigPage = () => {
  return (
    <Layout mode="container">
      <div className="content" dangerouslySetInnerHTML={{__html: mdContent}} />
      <div className="has-text-centered">
        <Link className="button is-primary is-large" to="/">Revenir à l'écran d'accueil</Link>
      </div>
    </Layout>
  );
};

export default ConfigPage;