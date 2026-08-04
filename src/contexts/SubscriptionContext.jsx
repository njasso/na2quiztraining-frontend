// src/contexts/SubscriptionContext.jsx
//
// Rend le système d'abonnement "fluide" comme demandé :
//  - lit l'abonnement réel de l'utilisateur (user.subscription, renvoyé par
//    le backend après /auth/verify ou /auth/login)
//  - calcule expiration / statut / jours restants
//  - notifie (toast + bannière persistante) à l'approche de l'expiration et
//    à l'expiration elle-même, avec un chemin direct vers le réabonnement
//  - fait respecter, CÔTÉ CLIENT, les limites du plan gratuit (nombre de
//    quiz/jour, génération IA/jour) — ceci est un filet de sécurité UX, PAS
//    une mesure de sécurité : le backend DOIT appliquer les mêmes limites
//    sur les endpoints POST /quizzes et POST /ai/generate, sinon elles sont
//    contournables (voir rapport d'audit, section abonnement).
//  - expose un point d'accroche pour le cas "plusieurs niveaux d'étude"
//    (offre Famille/Pro) : notifyEducationScopeChanged()
//
// Format attendu de user.subscription côté backend :
//   {
//     plan: 'free' | 'premium' | 'pro' | 'famille',
//     status: 'active' | 'trialing' | 'expired' | 'canceled',
//     startedAt: ISOString,
//     expiresAt: ISOString | null,   // null pour le plan gratuit
//     autoRenew: boolean,
//     maxNiveaux: number,            // combien de niveaux/enfants gérables
//   }

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription doit être utilisé dans un SubscriptionProvider');
  return ctx;
};

// Limites par plan. Doit rester synchronisé avec les features annoncées sur
// SubscriptionPage.jsx (PLANS) et avec les règles appliquées côté backend.
//
// ⚠️ maxNiveaux est fixé à 1 pour TOUS les plans actuellement vendables.
// Le compte utilisateur (user.education) ne peut porter qu'un seul niveau
// d'étude à la fois — il n'existe aujourd'hui aucun mécanisme (comptes
// enfants, profils, familyId) permettant de gérer plusieurs niveaux sous un
// même abonnement. Vendre un plan avec maxNiveaux > 1 avant que ce
// mécanisme existe reviendrait à facturer une fonctionnalité indisponible.
// Voir rapport d'audit §5 pour la recommandation (comptes enfants reliés
// par un familyId) : quand ce système sera construit, relever maxNiveaux
// sur le(s) plan(s) concerné(s) ET les rendre à nouveau sélectionnables
// dans SubscriptionPage.jsx.
export const PLAN_LIMITS = {
  free:    { quizzesPerDay: 5,        aiPerDay: 3,        exportsPerMonth: 2,        maxNiveaux: 1, label: 'Gratuit' },
  premium: { quizzesPerDay: Infinity, aiPerDay: Infinity, exportsPerMonth: 50,       maxNiveaux: 1, label: 'Premium' },
  pro:     { quizzesPerDay: Infinity, aiPerDay: Infinity, exportsPerMonth: Infinity, maxNiveaux: 1, label: 'Pro' },
};

// Fonctionnalités binaires par plan (au-delà des quotas numériques
// ci-dessus) — voir document de recommandations, section 9.1. Point d'entrée
// unique pour toute restriction premium future : ajouter une clé ici plutôt
// que de disperser des vérifications ad hoc dans le code.
export const PLAN_FEATURES = {
  free:    { bulletinDownload: false, certificats: false, modeHorsLigne: false, supportPrioritaire: false, apiAccess: false, analyseAvancee: false },
  premium: { bulletinDownload: true,  certificats: true,  modeHorsLigne: true,  supportPrioritaire: true,  apiAccess: false, analyseAvancee: true  },
  pro:     { bulletinDownload: true,  certificats: true,  modeHorsLigne: true,  supportPrioritaire: true,  apiAccess: true,  analyseAvancee: true  },
};


const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_THRESHOLDS = [7, 3, 1]; // jours avant expiration où l'on notifie

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthKey() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function usageStorageKey(userId) {
  return `na2_usage_${userId || 'anon'}`;
}

function loadUsage(userId) {
  try {
    const raw = localStorage.getItem(usageStorageKey(userId));
    const data = raw ? JSON.parse(raw) : null;
    const base = { date: todayKey(), quizzes: 0, ai: 0, month: monthKey(), exports: 0 };
    if (!data) return base;
    return {
      date: data.date === todayKey() ? data.date : todayKey(),
      quizzes: data.date === todayKey() ? (data.quizzes || 0) : 0,
      ai: data.date === todayKey() ? (data.ai || 0) : 0,
      month: data.month === monthKey() ? data.month : monthKey(),
      exports: data.month === monthKey() ? (data.exports || 0) : 0,
    };
  } catch {
    return { date: todayKey(), quizzes: 0, ai: 0, month: monthKey(), exports: 0 };
  }
}

function saveUsage(userId, usage) {
  try {
    localStorage.setItem(usageStorageKey(userId), JSON.stringify(usage));
  } catch {
    // stockage indisponible (navigation privée) : on continue sans persister
  }
}

export const SubscriptionProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(() => loadUsage(user?._id || user?.id));
  const [warnedToday, setWarnedToday] = useState(new Set());

  // Réinitialiser le compteur d'usage si l'utilisateur change ou change de jour
  useEffect(() => {
    setUsage(loadUsage(user?._id || user?.id));
  }, [user?._id, user?.id]);

  const subscription = user?.subscription || {
    plan: 'free',
    status: 'active',
    startedAt: null,
    expiresAt: null,
    autoRenew: false,
    maxNiveaux: 1,
  };

  const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free;

  const daysUntilExpiry = useMemo(() => {
    if (!subscription.expiresAt) return null;
    const diff = new Date(subscription.expiresAt).getTime() - Date.now();
    return Math.ceil(diff / DAY_MS);
  }, [subscription.expiresAt]);

  const isExpired =
    subscription.plan !== 'free' &&
    (subscription.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry <= 0));

  // Un abonnement expiré redevient effectivement un plan gratuit pour le
  // calcul des limites, même si le backend n'a pas encore basculé
  // `subscription.plan` — c'est la garantie qu'un accès payant expiré ne
  // continue jamais silencieusement.
  const effectivePlanId = isExpired ? 'free' : subscription.plan || 'free';
  const effectiveLimits = PLAN_LIMITS[effectivePlanId] || PLAN_LIMITS.free;

  // ── Notifications d'expiration ─────────────────────────────────────────
  useEffect(() => {
    if (!user || subscription.plan === 'free') return;

    if (isExpired) {
      const key = `expired-${todayKey()}`;
      if (!warnedToday.has(key)) {
        toast.error(
          "Votre abonnement a expiré. Vous êtes repassé au plan Gratuit.",
          { duration: 6000, icon: '⏰' }
        );
        setWarnedToday((prev) => new Set(prev).add(key));
      }
      return;
    }

    if (daysUntilExpiry !== null && WARN_THRESHOLDS.includes(daysUntilExpiry)) {
      const key = `warn-${daysUntilExpiry}-${todayKey()}`;
      if (!warnedToday.has(key)) {
        toast(
          daysUntilExpiry === 1
            ? "Votre abonnement expire demain. Renouvelez-le pour ne rien perdre."
            : `Votre abonnement expire dans ${daysUntilExpiry} jours.`,
          { icon: '📅', duration: 6000 }
        );
        setWarnedToday((prev) => new Set(prev).add(key));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isExpired, daysUntilExpiry]);

  // ── Compteurs d'usage quotidien (défense en profondeur côté client) ────
  const recordQuizCreated = useCallback(() => {
    setUsage((prev) => {
      const next = { ...loadUsage(user?._id || user?.id), quizzes: prev.quizzes + 1 };
      saveUsage(user?._id || user?.id, next);
      return next;
    });
  }, [user]);

  const recordAIUsed = useCallback(() => {
    setUsage((prev) => {
      const next = { ...loadUsage(user?._id || user?.id), ai: prev.ai + 1 };
      saveUsage(user?._id || user?.id, next);
      return next;
    });
  }, [user]);

  const recordExport = useCallback(() => {
    setUsage((prev) => {
      const next = { ...loadUsage(user?._id || user?.id), exports: prev.exports + 1 };
      saveUsage(user?._id || user?.id, next);
      return next;
    });
  }, [user]);

  const remainingQuizzesToday = effectiveLimits.quizzesPerDay === Infinity
    ? Infinity
    : Math.max(0, effectiveLimits.quizzesPerDay - usage.quizzes);

  const remainingAIToday = effectiveLimits.aiPerDay === Infinity
    ? Infinity
    : Math.max(0, effectiveLimits.aiPerDay - usage.ai);

  const remainingExportsThisMonth = effectiveLimits.exportsPerMonth === Infinity
    ? Infinity
    : Math.max(0, effectiveLimits.exportsPerMonth - usage.exports);

  const effectiveFeatures = PLAN_FEATURES[effectivePlanId] || PLAN_FEATURES.free;

  /** Vérifie une fonctionnalité binaire du plan (voir PLAN_FEATURES). */
  const hasFeature = useCallback((featureName) => !!effectiveFeatures[featureName], [effectiveFeatures]);

  /**
   * À appeler AVANT de lancer une création de quiz manuelle/DB. Bloque et
   * redirige vers /subscription si la limite quotidienne est atteinte.
   */
  const canCreateQuiz = useCallback(() => {
    if (remainingQuizzesToday > 0) return true;
    toast.error(
      `Limite de ${effectiveLimits.quizzesPerDay} quiz/jour atteinte pour le plan ${effectiveLimits.label}.`,
      { icon: '🔒' }
    );
    navigate('/subscription');
    return false;
  }, [remainingQuizzesToday, effectiveLimits, navigate]);

  /** À appeler AVANT un appel de génération IA. */
  const canUseAI = useCallback(() => {
    if (remainingAIToday > 0) return true;
    toast.error(
      `Limite de ${effectiveLimits.aiPerDay} générations IA/jour atteinte pour le plan ${effectiveLimits.label}.`,
      { icon: '🔒' }
    );
    navigate('/subscription');
    return false;
  }, [remainingAIToday, effectiveLimits, navigate]);

  /**
   * À appeler AVANT de générer/télécharger un bulletin (voir
   * QuizCompositionPage.handlePrintBulletin). Le plan Gratuit ne donne pas
   * accès au téléchargement du tout (bulletinDownload=false) ; Premium/Pro y
   * ont accès dans la limite de leur quota mensuel d'exports.
   */
  const canExportBulletin = useCallback(() => {
    if (!hasFeature('bulletinDownload')) {
      toast.error(
        `Le téléchargement de bulletin n'est pas inclus dans le plan ${effectiveLimits.label}.`,
        { icon: '🔒' }
      );
      navigate('/subscription');
      return false;
    }
    if (remainingExportsThisMonth <= 0) {
      toast.error(
        `Limite de ${effectiveLimits.exportsPerMonth} exports/mois atteinte pour le plan ${effectiveLimits.label}.`,
        { icon: '🔒' }
      );
      navigate('/subscription');
      return false;
    }
    return true;
  }, [hasFeature, remainingExportsThisMonth, effectiveLimits, navigate]);

  /**
   * Appelé quand l'utilisateur essaie d'ajouter/changer de niveau d'étude
   * (ex: un parent voudrait ajouter un 2e enfant/niveau). Aucun plan actuel
   * ne supporte plusieurs niveaux (voir PLAN_LIMITS ci-dessus) : on informe
   * honnêtement plutôt que de rediriger vers une offre qui n'existe pas.
   * À adapter le jour où le système de comptes enfants (familyId) sera
   * construit — voir rapport d'audit §5.
   */
  const notifyEducationScopeChanged = useCallback((updatedUser, requestedNiveauxCount = 1) => {
    const plan = updatedUser?.subscription?.plan || 'free';
    const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    if (requestedNiveauxCount > planLimits.maxNiveaux) {
      toast(
        "La gestion de plusieurs niveaux d'étude sur un même compte n'est pas encore disponible. Créez un compte séparé pour chaque niveau en attendant.",
        { icon: 'ℹ️', duration: 7000 }
      );
      return false;
    }
    return true;
  }, []);

  const value = {
    subscription,
    effectivePlanId,
    limits: effectiveLimits,
    features: effectiveFeatures,
    isExpired,
    daysUntilExpiry,
    isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    remainingQuizzesToday,
    remainingAIToday,
    remainingExportsThisMonth,
    canCreateQuiz,
    canUseAI,
    canExportBulletin,
    hasFeature,
    recordQuizCreated,
    recordAIUsed,
    recordExport,
    notifyEducationScopeChanged,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
