// src/pages/Auth/GoogleCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { handleSocialCallback } from '../../services/api';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage('Authentification Google annulée ou échouée.');
          toast.error('Échec de l\'authentification Google');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setStatus('error');
          setErrorMessage('Token d\'authentification manquant.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const result = handleSocialCallback(token, refreshToken);
        
        if (result.success) {
          setStatus('success');
          toast.success('Connexion Google réussie !');
          
          setTimeout(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'admin' || user.role === 'superadmin') {
              navigate('/dashboard');
            } else {
              navigate('/quizzes');
            }
          }, 1500);
        } else {
          throw new Error(result.error || 'Échec de l\'authentification');
        }
      } catch (error) {
        console.error('❌ Erreur callback Google:', error);
        setStatus('error');
        setErrorMessage(error.message);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
    }}>
      <NavHome />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 24,
          padding: '48px 64px',
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <Loader size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            <h2 style={{ color: '#f8fafc', marginTop: 24 }}>Connexion Google en cours...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} color="#10b981" />
            <h2 style={{ color: '#f8fafc', marginTop: 24 }}>Connexion réussie !</h2>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} color="#ef4444" />
            <h2 style={{ color: '#f8fafc', marginTop: 24 }}>Échec de l'authentification</h2>
            <p style={{ color: '#94a3b8' }}>{errorMessage}</p>
            <button onClick={() => navigate('/login')} style={{ marginTop: 16, padding: '10px 24px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
              Retour à la connexion
            </button>
          </>
        )}
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GoogleCallback;