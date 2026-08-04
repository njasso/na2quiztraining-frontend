// src/pages/LoginPage.jsx — VERSION CORRIGÉE (Garde ton design et tes fonctions)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft,
  Facebook, AlertCircle, CheckCircle, Chrome
} from 'lucide-react';
import {
  initiateFacebookLogin,
  initiateGoogleLogin
} from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Import crucial
import toast from 'react-hot-toast';

const LoginPage = () => {
  // ✅ On récupère les fonctions et l'état du contexte d'authentification
  const { login: contextLogin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const hasRedirected = useRef(false);

  const [showPassword,   setShowPassword]   = useState(false);
  const [loading,        setLoading]         = useState(false); // Loading local pour le bouton
  const [socialLoading,  setSocialLoading]   = useState(null);
  const [formData,       setFormData]        = useState({
    email: '', password: '', rememberMe: false,
  });
  const [errors,         setErrors]          = useState({});
  const [serverError,    setServerError]     = useState('');
  const [successMessage] = useState(location.state?.message || '');

  // ── ✅ REDIRECTION STABLE (Remplace ton ancienne version à problème) ──
  useEffect(() => {
    // Si l'utilisateur est authentifié et que le contexte a fini de charger
    if (!authLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // On récupère le rôle depuis le localStorage (sauvegardé par AuthContext)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (user?.role === 'admin' || user?.role === 'superadmin') {
        navigate('/dashboard', { replace: true });
      } else if (user?.role === 'formateur') {
        navigate('/formateur/dashboard', { replace: true });
      } else {
        navigate('/quizzes', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  // ── Email sauvegardé ──────────────────────────────────────────────────────
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const validateForm = () => {
    const e = {};
    if (!formData.email.trim())              e.email    = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Format d'email invalide";
    if (!formData.password)                  e.password = "Le mot de passe est requis";
    else if (formData.password.length < 6)   e.password = "Mot de passe incorrect";
    return e;
  };

  // ── ✅ SOUMISSION MISE À JOUR ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setServerError('');
    setErrors({});

    try {
      // ✅ On utilise contextLogin au lieu de l'api directe 
      // pour que toute l'app soit notifiée du changement d'état
      const result = await contextLogin(formData.email, formData.password);

      if (result.success) {
        if (formData.rememberMe) localStorage.setItem('savedEmail', formData.email);
        else                     localStorage.removeItem('savedEmail');
        toast.success('Connexion réussie !');
        // La redirection sera faite automatiquement par le useEffect au-dessus
      } else {
        setServerError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      setServerError('Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setSocialLoading(provider);
    try {
      if (provider === 'facebook') initiateFacebookLogin();
      else if (provider === 'google') initiateGoogleLogin();
      toast.loading(`Redirection vers ${provider}...`, { duration: 3000 });
    } catch {
      toast.error(`Impossible de se connecter avec ${provider}`);
      setSocialLoading(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU (Ton design original est 100% conservé ici)
  // ─────────────────────────────────────────────────────────────────────────
  
  // On affiche rien tant que le AuthContext vérifie le token au démarrage
  if (authLoading) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Glow */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Bouton retour */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'absolute', top: 24, left: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, color: '#94a3b8', cursor: 'pointer', zIndex: 10,
        }}
      >
        <ArrowLeft size={18} />
        Retour
      </motion.button>

      {/* Carte de connexion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 440,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 32, padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(99,102,241,0.4)',
          }}>
            <LogIn size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            Connexion
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Accédez à votre espace NA2 Quiz
          </p>
        </div>

        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            <CheckCircle size={16} color="#10b981" />
            <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>{successMessage}</p>
          </motion.div>
        )}

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <AlertCircle size={16} color="#ef4444" />
            <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{serverError}</p>
          </motion.div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: 8 }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email" name="email" value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                autoComplete="email"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.email ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem',
                  outline: 'none', opacity: loading ? 0.7 : 1, boxSizing: 'border-box',
                }}
              />
            </div>
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: 8 }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password" value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 44px 14px 44px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.password ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem',
                  outline: 'none', opacity: loading ? 0.7 : 1, boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: loading ? 'not-allowed' : 'pointer', padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.password}</p>}
          </div>

          {/* Se souvenir */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox" name="rememberMe"
                checked={formData.rememberMe} onChange={handleInputChange}
                disabled={loading}
                style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: loading ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Se souvenir de moi</span>
            </label>
          </div>

          {/* Bouton connexion */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: '1rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 20px rgba(99,102,241,0.3)',
              marginBottom: 20, transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 20, height: 20,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Connexion en cours...
              </>
            ) : (
              <><LogIn size={18} /> Se connecter</>
            )}
          </motion.button>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.2)' }} />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>ou continuer avec</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.2)' }} />
          </div>

          {/* Boutons sociaux */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { provider: 'google',   Icon: Chrome,   color: '#ea4335', label: 'Google' },
              { provider: 'facebook', Icon: Facebook,  color: '#1877F2', label: 'Facebook' },
            ].map(({ provider, Icon, color, label }) => (
              <motion.button
                key={provider}
                type="button"
                onClick={() => handleSocialLogin(provider)}
                disabled={!!(loading || socialLoading)}
                whileHover={{ scale: (loading || socialLoading) ? 1 : 1.02 }}
                whileTap={{ scale: (loading || socialLoading) ? 1 : 0.98 }}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, color: 'white', fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: (loading || socialLoading) ? 'not-allowed' : 'pointer',
                  opacity: (loading || socialLoading) ? 0.5 : 1,
                }}
              >
                {socialLoading === provider ? (
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                ) : (
                  <><Icon size={18} color={color} />{label}</>
                )}
              </motion.button>
            ))}
          </div>

          {/* Inscription */}
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
              S'inscrire gratuitement
            </Link>
          </p>

          {/* Démo */}
          <div style={{ marginTop: 20, padding: '12px', background: 'rgba(99,102,241,0.05)', borderRadius: 8 }}>
            <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
              Contactez l'administrateur : efelixmagloire@gmail.com
            </p>
          </div>
        </form>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;