// src/components/ExamVisibilityPicker.jsx
//
// Bloc réutilisable (Manual/Database/Generate quiz creation) pour choisir
// à qui une épreuve est destinée. Voir src/utils/examVisibility.js.
//
// Charge les classes du formateur (si le compte en a) pour lui éviter de
// ressaisir sa liste d'apprenants à chaque épreuve — voir MesClasses.jsx et
// document de recommandations §4/§7. Simple bouton "Assigner à une classe" :
// pas de dépendance dure, si l'appel échoue le picker reste utilisable en
// saisie manuelle.

import React, { useState, useEffect } from 'react';
import { Globe, Users, Lock, UsersRound, Loader } from 'lucide-react';
import { EXAM_VISIBILITY, EXAM_VISIBILITY_LABELS } from '../utils/examVisibility';
import { getMyClasses, getClasseDetails } from '../services/api';

const OPTIONS = [
  { value: EXAM_VISIBILITY.PUBLIC, icon: Globe, color: '#10b981' },
  { value: EXAM_VISIBILITY.ASSIGNED, icon: Users, color: '#6366f1' },
  { value: EXAM_VISIBILITY.PRIVATE, icon: Lock, color: '#64748b' },
];

const ExamVisibilityPicker = ({ visibility, onVisibilityChange, assignedToRaw, onAssignedToChange }) => {
  const [classes, setClasses] = useState([]);
  const [loadingClasse, setLoadingClasse] = useState(null); // id de la classe en cours de résolution

  useEffect(() => {
    if (visibility !== EXAM_VISIBILITY.ASSIGNED) return;
    let cancelled = false;
    getMyClasses()
      .then((data) => {
        if (cancelled) return;
        setClasses(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => {
        // Pas de classe, ou compte sans droit — le picker reste utilisable
        // en saisie manuelle, on n'affiche simplement pas le raccourci.
        if (!cancelled) setClasses([]);
      });
    return () => { cancelled = true; };
  }, [visibility]);

  const assignToClasse = async (classe) => {
    const classeId = classe._id || classe.id;
    setLoadingClasse(classeId);
    try {
      const data = await getClasseDetails(classeId);
      const membres = data?.membres || data?.members || [];
      const identifiants = membres.map((m) => m.email || m.matricule).filter(Boolean);
      if (identifiants.length === 0) {
        onAssignedToChange(assignedToRaw); // classe vide, rien à ajouter
        return;
      }
      const existants = new Set(
        assignedToRaw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
      );
      identifiants.forEach((id) => existants.add(id));
      onAssignedToChange([...existants].join('\n'));
    } catch (err) {
      console.error('Erreur chargement des membres de la classe:', err);
    } finally {
      setLoadingClasse(null);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
        Destinataires de l'épreuve *
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {OPTIONS.map(({ value, icon: Icon, color }) => {
          const active = visibility === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onVisibilityChange(value)}
              style={{
                padding: '12px 10px',
                borderRadius: 12,
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 400,
                textAlign: 'center',
              }}
            >
              <Icon size={18} />
              {value === EXAM_VISIBILITY.PUBLIC && 'Publique'}
              {value === EXAM_VISIBILITY.ASSIGNED && 'Assignée'}
              {value === EXAM_VISIBILITY.PRIVATE && 'Privée'}
            </button>
          );
        })}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 6 }}>
        {EXAM_VISIBILITY_LABELS[visibility]}
      </p>

      {visibility === EXAM_VISIBILITY.ASSIGNED && (
        <div style={{ marginTop: 12 }}>
          {classes.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 6 }}>
                Assigner à une classe entière (ajoute ses membres à la liste ci-dessous) :
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {classes.map((c) => (
                  <button
                    key={c._id || c.id}
                    type="button"
                    onClick={() => assignToClasse(c)}
                    disabled={loadingClasse === (c._id || c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 99,
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                      fontSize: '0.75rem', cursor: 'pointer',
                    }}
                  >
                    {loadingClasse === (c._id || c.id) ? <Loader size={12} /> : <UsersRound size={12} />}
                    {c.nom} ({c.membresCount ?? c.membres?.length ?? 0})
                  </button>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: 6 }}>
            Apprenants concernés (un email ou matricule par ligne, ou séparés par des virgules)
          </label>
          <textarea
            value={assignedToRaw}
            onChange={(e) => onAssignedToChange(e.target.value)}
            rows={3}
            placeholder={'eleve1@exemple.cm\neleve2@exemple.cm'}
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <p style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 4 }}>
            L'épreuve sera aussi accessible via son code de partage, quel que soit ce qui est saisi ici.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamVisibilityPicker;
