// src/components/SubscriptionBanner.jsx
//
// Bannière discrète mais persistante, affichée en haut des pages internes,
// qui rend le cycle de vie de l'abonnement visible en permanence — pas
// seulement via un toast qu'on peut manquer.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionBanner = () => {
  const { isAuthenticated } = useAuth();
  const { subscription, isExpired, isExpiringSoon, daysUntilExpiry } = useSubscription();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;
  if (subscription.plan === 'free') return null; // rien à signaler sur le plan gratuit
  if (!isExpired && !isExpiringSoon) return null;

  const expired = isExpired;

  return (
    <div
      onClick={() => navigate('/subscription')}
      style={{
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        background: expired ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
        borderBottom: `1px solid ${expired ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
        color: expired ? '#fca5a5' : '#fcd34d',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      {expired ? <AlertTriangle size={16} /> : <Clock size={16} />}
      <span style={{ flex: 1 }}>
        {expired
          ? "Votre abonnement a expiré — vous utilisez le plan Gratuit. Réabonnez-vous pour retrouver vos avantages."
          : `Votre abonnement expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}. Renouvelez-le pour ne rien perdre.`}
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 99,
        background: expired ? '#ef4444' : '#f59e0b', color: '#0a0f2e', fontWeight: 700,
      }}>
        <Crown size={13} /> {expired ? 'Se réabonner' : 'Renouveler'}
      </span>
    </div>
  );
};

export default SubscriptionBanner;
