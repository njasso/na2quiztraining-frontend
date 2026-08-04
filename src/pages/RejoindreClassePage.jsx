// src/pages/RejoindreClassePage.jsx
//
// Un apprenant saisit le code d'invitation partagé par son formateur pour
// être rattaché à sa classe (document de recommandations §4).

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { joinClasseByCode } from '../services/api';
import NavHome from '../components/NavHome';

const RejoindreClassePage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(null);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const data = await joinClasseByCode(trimmed);
      const classe = data?.classe || data?.data || data;
      setJoined(classe);
      toast.success(`Vous avez rejoint "${classe?.nom || 'la classe'}" !`);
    } catch (err) {
      console.error('Erreur rejoindre classe:', err);
      toast.error(
        err?.response?.data?.error ||
        "Code invalide ou expiré. Vérifiez-le auprès de votre formateur."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <NavHome />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 440, background: 'rgba(15,23,42,0.7)',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24, padding: 32,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 20, fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div style={{
          width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={26} color="white" />
        </div>

        <h1 style={{ textAlign: 'center', color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>
          Rejoindre une classe
        </h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 24 }}>
          Entrez le code partagé par votre formateur ou répétiteur.
        </p>

        {joined ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" style={{ marginBottom: 10 }} />
            <p style={{ color: '#e2e8f0', marginBottom: 20 }}>
              Vous faites maintenant partie de <strong>{joined.nom}</strong>.
            </p>
            <button
              onClick={() => navigate('/quizzes')}
              style={{
                width: '100%', padding: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', borderRadius: 12, color: 'white', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Continuer
            </button>
          </div>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Ex: EDU-MAT-TC-A427"
              style={{
                width: '100%', padding: 14, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12,
                color: '#f8fafc', fontSize: '1rem', textAlign: 'center',
                letterSpacing: '0.05em', outline: 'none', marginBottom: 16,
              }}
            />
            <button
              onClick={handleJoin}
              disabled={loading || !code.trim()}
              style={{
                width: '100%', padding: 14,
                background: (loading || !code.trim()) ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none', borderRadius: 12, color: 'white', fontWeight: 600,
                cursor: (loading || !code.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Vérification…' : 'Rejoindre'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RejoindreClassePage;
