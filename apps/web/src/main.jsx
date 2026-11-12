import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './store/store';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/error-boundary';
import { CloudSync } from './sync/CloudSync';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <CloudSync />
        <AppRouter />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
