// src/pages/ChooseLevelPage.jsx
//
// Étape OBLIGATOIRE affichée une seule fois, juste après la première
// connexion (inscription classique OU première connexion Google/Facebook),
// tant que user.education n'est pas renseigné.
//
// Objectif demandé : "un utilisateur qui choisit un niveau d'étude ne doit
// voir que les données qui correspondent à sa classe/niveau" — ce choix est
// donc bloquant : on ne peut pas naviguer dans l'app sans lui (voir
// RequireEducationLevel.jsx qui applique le blocage sur les routes).

import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { updateProfile } from '../services/api';
import {
  getAllDomaines,
  getAllSousDomaines,
  getAllLevels,
  getAllMatieres,
} from '../data/domainConfig';

const STEPS = ['domaine', 'filiere', 'classe', 'matieres'];

const ChooseLevelPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const { notifyEducationScopeChanged } = useSubscription();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [domainId, setDomainId] = useState(user?.education?.domainId || '');
  const [sousDomaineId, setSousDomaineId] = useState(user?.education?.sousDomaineId || '');
  const [levelId, setLevelId] = useState(user?.education?.levelId || '');
  const [matieresAutorisees, setMatieresAutorisees] = useState(
    user?.education?.matieresAutorisees || []
  );

  const domaines = useMemo(() => getAllDomaines(), []);
  const sousDomaines = useMemo(
    () => (domainId ? getAllSousDomaines(domainId) : []),
    [domainId]
  );
  const levels = useMemo(
    () => (domainId && sousDomaineId ? getAllLevels(domainId, sousDomaineId) : []),
    [domainId, sousDomaineId]
  );
  const matieres = useMemo(
    () => (domainId && sousDomaineId ? getAllMatieres(domainId, sousDomaineId) : []),
    [domainId, sousDomaineId]
  );

  const canGoNext = () => {
    if (STEPS[step] === 'domaine') return !!domainId;
    if (STEPS[step] === 'filiere') return !!sousDomaineId;
    if (STEPS[step] === 'classe') return !!levelId;
    return true; // matières : optionnel (vide = toutes autorisées)
  };

  const toggleMatiere = (id) => {
    setMatieresAutorisees((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const goNext = () => {
    if (!canGoNext()) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else handleSave();
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    const education = { domainId, sousDomaineId, levelId, matieresAutorisees };

    try {
      // On persiste côté serveur pour que le filtrage soit fiable partout
      // (autres appareils, back-office, requêtes API directes).
      const res = await updateProfile({ education });
      const updatedUser = { ...user, education: res?.user?.education || education };
      updateUser(updatedUser);

      // Un changement de niveau peut nécessiter un ajustement d'abonnement
      // (ex: offre famille multi-niveaux) : on prévient le contexte
      // d'abonnement pour qu'il recalcule ce qui est autorisé.
      notifyEducationScopeChanged(updatedUser);

      toast.success('Niveau enregistré !');
      const redirectTo = location.state?.from || '/quizzes';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Erreur sauvegarde niveau:', err);
      toast.error(
        err?.response?.data?.error ||
          "Impossible d'enregistrer votre niveau. Réessayez."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 560, background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 28, padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, margin: '0 auto 14px', borderRadius: 16,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={30} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
            Quel est votre niveau d'étude ?
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Cette information est obligatoire : elle détermine les matières, quiz et
            examens que vous verrez. Vous pourrez la modifier plus tard dans votre profil.
          </p>
        </div>

        {/* Indicateur d'étapes */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: i <= step ? '#6366f1' : 'rgba(255,255,255,0.1)',
            }} />
          ))}
        </div>

        {/* Étape : domaine */}
        {STEPS[step] === 'domaine' && (
          <OptionGrid
            items={domaines}
            selectedId={domainId}
            onSelect={(id) => { setDomainId(id); setSousDomaineId(''); setLevelId(''); }}
          />
        )}

        {/* Étape : filière / sous-domaine */}
        {STEPS[step] === 'filiere' && (
          <OptionGrid
            items={sousDomaines}
            selectedId={sousDomaineId}
            onSelect={(id) => { setSousDomaineId(id); setLevelId(''); }}
          />
        )}

        {/* Étape : classe / niveau précis */}
        {STEPS[step] === 'classe' && (
          <OptionGrid items={levels} selectedId={levelId} onSelect={setLevelId} compact />
        )}

        {/* Étape : matières (optionnel) */}
        {STEPS[step] === 'matieres' && (
          <div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 12 }}>
              Optionnel — laissez tout décoché pour avoir accès à toutes les matières de
              votre niveau. Utile si un parent souhaite restreindre l'accès à certaines
              matières pour un enfant.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {matieres.map((m) => {
                const active = matieresAutorisees.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMatiere(m.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 99,
                      border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
                      background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#a5b4fc' : '#94a3b8',
                      fontSize: '0.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {active && <Check size={14} />}
                    {m.nom}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button
              onClick={goBack}
              disabled={saving}
              style={{
                padding: '12px 18px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
                color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} /> Retour
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canGoNext() || saving}
            style={{
              flex: 1, padding: '12px 18px',
              background: (!canGoNext() || saving) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', borderRadius: 12, color: 'white', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: (!canGoNext() || saving) ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Enregistrement...' : step === STEPS.length - 1 ? 'Terminer' : 'Continuer'}
            {!saving && <ChevronRight size={18} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const OptionGrid = ({ items, selectedId, onSelect, compact }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(90px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 10,
    maxHeight: 340,
    overflowY: 'auto',
  }}>
    {items.length === 0 && (
      <p style={{ color: '#64748b', fontSize: '0.85rem', gridColumn: '1 / -1' }}>
        Aucune option disponible pour ce choix.
      </p>
    )}
    {items.map((item) => {
      const active = String(selectedId) === String(item.id);
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          style={{
            padding: '12px 14px', borderRadius: 12, textAlign: 'left',
            border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
            background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            color: active ? '#f8fafc' : '#cbd5e1',
            fontSize: '0.85rem', fontWeight: active ? 600 : 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          {item.nom}
          {active && <Check size={16} color="#a5b4fc" />}
        </button>
      );
    })}
  </div>
);

export default ChooseLevelPage;
