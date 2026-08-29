import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

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
