import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './index.css';

if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => {
          if (a === null || a === undefined) return String(a);
          if (typeof a === 'object') {
            try {
              return JSON.stringify(a, Object.getOwnPropertyNames(a)).slice(0, 500);
            } catch {
              return '[Circular]';
            }
          }
          return String(a);
        })
        .join(' ');
      if (msg.includes('185') || msg.includes('not valid') || msg.includes('object')) {
        try {
          localStorage.setItem('kreathief_debug_error', JSON.stringify({ time: Date.now(), msg: msg.slice(0, 2000) }));
        } catch {}
      }
    } catch {}
    origConsoleError.apply(console, args);
  };
  window.addEventListener('error', (e) => {
    try {
      localStorage.setItem(
        'kreathief_crash',
        JSON.stringify({ time: Date.now(), message: e.message, filename: e.filename, lineno: e.lineno })
      );
    } catch {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      localStorage.setItem(
        'kreathief_crash',
        JSON.stringify({ time: Date.now(), reason: String(e.reason).slice(0, 500) })
      );
    } catch {}
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
