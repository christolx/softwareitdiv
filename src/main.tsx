import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Render aplikasi React
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);