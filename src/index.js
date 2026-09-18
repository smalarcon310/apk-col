import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, HashRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

root.render(
  <Router>
    <App />
  </Router>
);

// Reportar métricas de rendimiento
reportWebVitals();
