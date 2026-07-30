// src/contexts/OfflineContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineManager } from '../services/offlineManager';
import toast from 'react-hot-toast';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('Connexion rétablie ! Synchronisation en cours...');
      
      setIsSyncing(true);
      try {
        await offlineManager.syncAll();
        const pending = await offlineManager.getPendingResults();
        setPendingSync(pending.length);
        toast.success('Synchronisation terminée !');
      } catch (error) {
        console.error('Erreur sync:', error);
        toast.error('Erreur lors de la synchronisation');
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Mode hors ligne activé. Vos données seront synchronisées automatiquement.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mettre à jour le compteur de synchronisation
    const updatePendingCount = async () => {
      const pending = await offlineManager.getPendingResults();
      setPendingSync(pending.length);
    };
    updatePendingCount();

    // Vérifier périodiquement
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const value = {
    isOnline,
    pendingSync,
    isSyncing,
    offlineManager,
    syncNow: async () => {
      if (isOnline) {
        setIsSyncing(true);
        await offlineManager.syncAll();
        setIsSyncing(false);
      }
    }
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};