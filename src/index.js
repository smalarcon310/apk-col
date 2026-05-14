import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, HashRouter } from 'react-router-dom';

// Importar configuración de Firebase
import './config/firebase';

const root = ReactDOM.createRoot(document.getElementById('root'));
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);

// Reportar métricas de rendimiento
reportWebVitals();
