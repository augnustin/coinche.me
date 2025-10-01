import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { marked } from 'marked';

import mdContent from '../content/help.md'

const ConfigPage = () => {
  const htmlContent = marked(mdContent);
  
  return (
    <Layout mode="container">
      <div className="content" dangerouslySetInnerHTML={{__html: htmlContent}} />
      <div className="has-text-centered">
        <Link className="button is-primary" to="/">Revenir à l'écran d'accueil</Link>
      </div>
    </Layout>
  );
};

export default ConfigPage;