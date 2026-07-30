// src/index.jsx — VERSION CORRIGÉE FINALE
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import './index.css';

// ── CONFIGURATION SERVICE WORKER (Transférée de main.jsx) ──
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW enregistré:', reg.scope))
      .catch(err => console.error('❌ Erreur SW:', err));
  });
}

if (import.meta.env.DEV) {
  navigator.serviceWorker?.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}

// ── CONFIGURATION REACT QUERY ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, 
    },
  },
});

// ── RENDU DE L'APPLICATION ──
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* IMPORTANT : Ne pas mettre AuthProvider ici ! 
          Il est déjà présent à l'intérieur de <App />.
          Le doubler cause l'erreur "dispatcher is null".
      */}
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);