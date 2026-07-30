// hooks/useSync.js
import { useEffect } from 'react';
import { syncLocalContentWithFirebase } from '../services/sync';

export const useSync = () => {
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncLocalContentWithFirebase();
      }
    }, 300000);

    return () => clearInterval(syncInterval);
  }, []);
};

// Dans votre composant racine (App.jsx)
import { useSync } from './hooks/useSync';

const App = () => {
  useSync();
  // ... reste du code
};