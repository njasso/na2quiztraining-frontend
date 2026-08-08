// src/components/SubscriptionStatusCard.jsx
// CORRECTION (audit strategique 1.10 / 2.6) : le plan d'abonnement, son
// statut et son echeance existaient deja cote backend (User.subscription)
// mais n'etaient affiches nulle part. Recommandation appliquee : visible
// dans les tableaux de bord apprenant et formateur, jamais pour un
// admin/superadmin (qui gere la plateforme, pas son propre abonnement —
// coherent avec isScopeExemptRole ailleurs dans l'application).
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PLAN_LABELS = {
  free: 'Gratuit',
  basic: 'Basique',
  premium: 'Premium',
  etablissement: 'Établissement',
  pro: 'Pro',
  enterprise: 'Établissement',
};

const SubscriptionStatusCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Jamais affiché pour les rôles métier — cohérent avec isScopeExemptRole
  if (!user || ['admin', 'superadmin'].includes(user.role)) return null;

  const sub = user.subscription || { plan: 'free', active: false };
  const planLabel = PLAN_LABELS[sub.plan] || sub.plan || 'Gratuit';
  const isFree = !sub.active || sub.plan === 'free';

  let daysLeft = null;
  if (sub.active && sub.endDate) {
    daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / 86400000));
  }
  const expiringSoon = daysLeft !== null && daysLeft <= 5;

  return (
    <div
      onClick={() => navigate('/subscription')}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
        background: isFree ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${isFree ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.3)'}`,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Crown size={20} color={isFree ? '#818cf8' : '#10b981'} />
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.88rem' }}>
            Plan {planLabel}
          </div>
          {daysLeft !== null && (
            <div style={{ color: expiringSoon ? '#fbbf24' : '#94a3b8', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              {expiringSoon ? <AlertTriangle size={12} /> : <Clock size={12} />}
              {daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Expire aujourd\'hui'}
            </div>
          )}
          {isFree && (
            <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
              Passez à un plan supérieur pour plus de fonctionnalités
            </div>
          )}
        </div>
      </div>
      <span style={{
        padding: '6px 14px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 600,
        background: isFree ? '#6366f1' : '#10b981', color: '#fff',
      }}>
        {isFree ? 'Découvrir les plans' : 'Gérer'}
      </span>
    </div>
  );
};

export default SubscriptionStatusCard;
