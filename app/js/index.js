import React from 'react';
import { createRoot } from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

import HelpPage from './pages/HelpPage';
import LandingPage from './pages/LandingPage';
import ConfigPage from './pages/ConfigPage';
import GamePage from './pages/GamePage';

const container = document.getElementById('container');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/game/:tableId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);