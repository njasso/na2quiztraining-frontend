// src/pages/Auth/FacebookCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { handleSocialCallback, fetchSocialUser } from '../../services/api';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const FacebookCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');
        const userId = searchParams.get('userId');

        console.log('📘 Facebook Callback:', { token: !!token, error, userId });

        // Gérer l'erreur
        if (error) {
          setStatus('error');
          setErrorMessage('Authentification Facebook annulée ou échouée.');
          toast.error('Échec de l\'authentification Facebook');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Vérifier le token
        if (!token) {
          setStatus('error');
          setErrorMessage('Token d\'authentification manquant.');
          toast.error('Token manquant');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Sauvegarder les tokens
        const result = handleSocialCallback(token, refreshToken);
        
        if (result.success) {
          // Récupérer les informations de l'utilisateur
          try {
            const user = await fetchSocialUser();
            if (user) {
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (userError) {
            console.warn('Impossible de récupérer les infos utilisateur:', userError);
          }

          setStatus('success');
          toast.success('Connexion Facebook réussie !');
          
          // Rediriger après un court délai
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
        console.error('❌ Erreur callback Facebook:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Une erreur est survenue lors de l\'authentification.');
        toast.error('Erreur d\'authentification');
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
      position: 'relative',
    }}>
      <NavHome />
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 24,
          padding: '48px 64px',
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        {status === 'loading' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Loader 
                size={48} 
                color="#6366f1" 
                style={{ 
                  animation: 'spin 1s linear infinite',
                }} 
              />
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: 8 }}>
              Authentification en cours...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Veuillez patienter pendant que nous finalisons votre connexion Facebook.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: 8 }}>
              Connexion réussie !
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Vous allez être redirigé vers l'application...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <XCircle size={48} color="#ef4444" />
            </div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', marginBottom: 8 }}>
              Échec de l'authentification
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 24 }}>
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 24px',
                background: '#6366f1',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FacebookCallback;