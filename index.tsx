import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a || {})).slice(0, 500) : String(a)).join(' ');
    if (msg.includes('185') || msg.includes('not valid') || msg.includes('object')) {
      try { localStorage.setItem('kreathief_debug_error', JSON.stringify({ time: Date.now(), msg, stack: args[2]?.componentStack || '' })); } catch {}
    }
    origConsoleError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
