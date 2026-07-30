// src/pages/RegisterPage.jsx - VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Lock, Eye, EyeOff, ArrowLeft, 
  Facebook, AlertCircle, CheckCircle, Chrome, Shield
} from 'lucide-react';
import { register, initiateFacebookLogin, initiateGoogleLogin } from '../services/api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // ✅ Ajout du rôle avec valeur par défaut
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ✅ Récupérer le token depuis localStorage pour vérifier si déjà connecté
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/quizzes');
    }
  }, [navigate]);

  // Calculer la force du mot de passe
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (/[a-z]/.test(formData.password)) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/\d/.test(formData.password)) strength++;
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength <= 3) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Faible';
    if (passwordStrength <= 3) return 'Moyen';
    return 'Fort';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Au moins 8 caractères';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Mot de passe trop faible';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll vers la première erreur
      const firstError = document.querySelector('[style*="border-color: #ef4444"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setServerError('');
    setErrors({});

    try {
      // ✅ Envoyer toutes les données incluant le rôle
      const data = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role // ✅ Le rôle est maintenant inclus
      });

      if (data.success) {
        setSuccessMessage('Inscription réussie ! Redirection vers la connexion...');
        toast.success('Compte créé avec succès !');
        
        // ✅ Afficher le rôle choisi dans le message
        const roleNames = {
          user: 'Utilisateur',
          formateur: 'Formateur',
          moderator: 'Modérateur',
          admin: 'Administrateur'
        };
        toast(`Type de compte: ${roleNames[formData.role] || 'Utilisateur'}`, {
          icon: '👤',
          duration: 3000
        });
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
              email: formData.email
            } 
          });
        }, 2000);
      } else {
        setServerError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur register:', error);
      
      if (error.message?.includes('Network')) {
        setServerError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else if (error.error) {
        setServerError(error.error);
      } else if (error.response?.data?.error) {
        setServerError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    setSocialLoading(provider);
    
    try {
      if (provider === 'facebook') {
        initiateFacebookLogin();
      } else if (provider === 'google') {
        initiateGoogleLogin();
      }
      
      toast.loading(`Redirection vers ${provider}...`, { duration: 3000 });
    } catch (error) {
      console.error(`Erreur ${provider}:`, error);
      toast.error(`Impossible de s'inscrire avec ${provider}`);
      setSocialLoading(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Effacer l'erreur serveur quand l'utilisateur modifie un champ
    if (serverError) {
      setServerError('');
    }
  };

  // Description des rôles
  const roleDescriptions = {
    user: 'Accès aux quiz, classement et fonctionnalités de base',
    formateur: 'Création de quiz, gestion des étudiants et statistiques avancées',
    moderator: 'Modération du contenu, gestion des signalements et support',
    admin: 'Accès complet à l\'administration du système'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Glow effect */}
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
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12,
          color: '#94a3b8',
          cursor: 'pointer',
          zIndex: 10,
        }}
        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowLeft size={18} />
        Retour
      </motion.button>

      {/* Carte d'inscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 560,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 32,
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 8px 16px rgba(99,102,241,0.3)',
            }}
          >
            N²
          </motion.div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: 8,
          }}>
            Créer un compte
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Rejoignez la communauté NA2 Quiz
          </p>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              color: '#10b981',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle size={18} />
            {successMessage}
          </motion.div>
        )}

        {/* Message d'erreur */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              color: '#f87171',
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={18} />
            {serverError}
          </motion.div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* Nom et Prénom */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
                Prénom
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: errors.firstName ? '#ef4444' : '#64748b',
                }} />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jean"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 12px 12px 36px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${errors.firstName ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem', outline: 'none',
                    opacity: loading ? 0.7 : 1,
                  }}
                />
              </div>
              {errors.firstName && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.firstName}</p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
                Nom
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: errors.lastName ? '#ef4444' : '#64748b',
                }} />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Dupont"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 12px 12px 36px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${errors.lastName ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem', outline: 'none',
                    opacity: loading ? 0.7 : 1,
                  }}
                />
              </div>
              {errors.lastName && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
              Adresse email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: errors.email ? '#ef4444' : '#64748b',
              }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean.dupont@email.com"
                autoComplete="email"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 14px 14px 44px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.email ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem', outline: 'none',
                  opacity: loading ? 0.7 : 1,
                }}
              />
            </div>
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.email}</p>
            )}
          </div>

          {/* ✅ Rôle / Type de compte - NOUVEAU */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
              <Shield size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Type de compte
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.role ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 12,
                color: '#f8fafc',
                fontSize: '0.95rem',
                outline: 'none',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="user">👤 Utilisateur standard</option>
              <option value="formateur">👨‍🏫 Formateur / Créateur de quiz</option>
              <option value="moderator">🛡️ Modérateur</option>
              <option value="admin">⚙️ Administrateur (accès complet)</option>
            </select>
            <p style={{ 
              color: '#64748b', 
              fontSize: '0.75rem', 
              marginTop: 4,
              fontStyle: 'italic'
            }}>
              {roleDescriptions[formData.role] || 'Choisissez le type de compte qui correspond à votre utilisation'}
            </p>
            {errors.role && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.role}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: errors.password ? '#ef4444' : '#64748b',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 44px 14px 44px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.password ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem', outline: 'none',
                  opacity: loading ? 0.7 : 1,
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
            
            {/* Indicateur de force */}
            {formData.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{
                      width: `${(passwordStrength / 5) * 100}%`, height: '100%',
                      background: getPasswordStrengthColor(), borderRadius: 2,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ color: getPasswordStrengthColor(), fontSize: '0.75rem', fontWeight: 600 }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  <span style={{ color: formData.password.length >= 8 ? '#10b981' : '#64748b' }}>✓ 8+ caractères</span>
                  {' • '}
                  <span style={{ color: /[A-Z]/.test(formData.password) ? '#10b981' : '#64748b' }}>✓ Majuscule</span>
                  {' • '}
                  <span style={{ color: /\d/.test(formData.password) ? '#10b981' : '#64748b' }}>✓ Chiffre</span>
                  {' • '}
                  <span style={{ color: /[^a-zA-Z0-9]/.test(formData.password) ? '#10b981' : '#64748b' }}>✓ Spécial</span>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.password}</p>
            )}
          </div>

          {/* Confirmation */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: errors.confirmPassword ? '#ef4444' : '#64748b',
              }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px 44px 14px 44px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 12, color: '#f8fafc', fontSize: '0.95rem', outline: 'none',
                  opacity: loading ? 0.7 : 1,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b',
                  cursor: loading ? 'not-allowed' : 'pointer', padding: 4,
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Conditions */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                disabled={loading}
                style={{
                  width: 18, height: 18, accentColor: '#6366f1',
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: 2,
                }}
              />
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                J'accepte les{' '}
                <Link to="/terms" target="_blank" style={{ color: '#a5b4fc', textDecoration: 'none' }}>
                  conditions d'utilisation
                </Link>
                {' '}et la{' '}
                <Link to="/privacy" target="_blank" style={{ color: '#a5b4fc', textDecoration: 'none' }}>
                  politique de confidentialité
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{errors.acceptTerms}</p>
            )}
          </div>

          {/* Bouton d'inscription */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 12, color: 'white', fontSize: '1rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 20px rgba(99,102,241,0.3)',
              marginBottom: 20,
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
                Inscription en cours...
              </>
            ) : (
              <>
                <User size={18} />
                S'inscrire gratuitement
              </>
            )}
          </motion.button>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.2)' }} />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>ou s'inscrire avec</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.2)' }} />
          </div>

          {/* Boutons sociaux */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <motion.button
              type="button"
              onClick={() => handleSocialSignup('google')}
              disabled={loading || socialLoading}
              whileHover={{ scale: (loading || socialLoading) ? 1 : 1.02 }}
              whileTap={{ scale: (loading || socialLoading) ? 1 : 0.98 }}
              style={{
                padding: '12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
                color: 'white', fontSize: '0.95rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: (loading || socialLoading) ? 'not-allowed' : 'pointer',
                opacity: (loading || socialLoading) ? 0.5 : 1,
              }}
            >
              {socialLoading === 'google' ? (
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              ) : (
                <>
                  <Chrome size={18} color="#ea4335" />
                  Google
                </>
              )}
            </motion.button>
            
            <motion.button
              type="button"
              onClick={() => handleSocialSignup('facebook')}
              disabled={loading || socialLoading}
              whileHover={{ scale: (loading || socialLoading) ? 1 : 1.02 }}
              whileTap={{ scale: (loading || socialLoading) ? 1 : 0.98 }}
              style={{
                padding: '12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
                color: 'white', fontSize: '0.95rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: (loading || socialLoading) ? 'not-allowed' : 'pointer',
                opacity: (loading || socialLoading) ? 0.5 : 1,
              }}
            >
              {socialLoading === 'facebook' ? (
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              ) : (
                <>
                  <Facebook size={18} color="#1877F2" />
                  Facebook
                </>
              )}
            </motion.button>
          </div>

          {/* Sécurité */}
          <div style={{
            padding: '12px',
            background: 'rgba(99,102,241,0.05)',
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
              🔒 Vos informations sont sécurisées et ne seront jamais partagées
            </p>
          </div>

          {/* Lien connexion */}
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>
              Se connecter
            </Link>
          </p>
        </form>
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;