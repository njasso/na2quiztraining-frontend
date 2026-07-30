// src/components/OfflineIndicator.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

const OfflineIndicator = () => {
  const { isOnline, pendingSync, isSyncing, syncNow } = useOffline();

  return (
    <AnimatePresence>
      {(!isOnline || pendingSync > 0) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            marginTop: 8,
            padding: '8px 20px',
            borderRadius: 40,
            background: isOnline ? '#f59e0b' : '#ef4444',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}>
            {isOnline ? (
              <>
                {isSyncing ? (
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Wifi size={14} />
                )}
                <span>
                  {pendingSync} élément{pendingSync > 1 ? 's' : ''} en attente de synchronisation
                </span>
                {!isSyncing && (
                  <button
                    onClick={syncNow}
                    style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: 12,
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Sync maintenant
                  </button>
                )}
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>Mode hors ligne - Les données seront synchronisées automatiquement</span>
              </>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;