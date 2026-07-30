// src/pages/Admin/AdminConfig.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, RefreshCw, Settings, Globe, Lock,
  Bell, Mail, Shield, Database, Cpu, HardDrive,
  Clock, Users, BookOpen, Award, Zap, Download,
  Upload, Trash2, AlertTriangle, CheckCircle, XCircle,
  Moon, Sun, Palette, Type, Eye, EyeOff, Volume2,
  Languages, Calendar, DollarSign, CreditCard, Gift,
  Link, Key, Server, Cloud, Wifi, Power, ToggleLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getConfig,
  updateConfig,
  resetConfig,
  getSystemStats,
  clearCache,
  getSystemHealth
} from '../../services/api';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const AdminConfig = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  
  // Configuration générale
  const [general, setGeneral] = useState({
    siteName: 'NA2 Quiz',
    siteDescription: 'Plateforme de quiz éducatifs',
    siteUrl: 'https://na2quiz.com',
    adminEmail: 'admin@na2quiz.com',
    supportEmail: 'support@na2quiz.com',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    language: 'fr',
    maintenanceMode: false,
    debugMode: false
  });

  // Configuration des utilisateurs
  const [userConfig, setUserConfig] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'user',
    maxUsers: 10000,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    allowSocialLogin: true,
    allowGuestLogin: false
  });

  // Configuration des quiz
  const [quizConfig, setQuizConfig] = useState({
    maxQuestionsPerQuiz: 100,
    minQuestionsPerQuiz: 1,
    allowPublicQuizzes: true,
    requireApproval: false,
    defaultQuizDuration: 30,
    maxQuizDuration: 120,
    allowQuizSharing: true,
    allowQuizDownload: true,
    maxQuizSize: 50, // MB
    allowedFileTypes: ['.pdf', '.docx', '.txt']
  });

  // Configuration des notifications
  const [notifConfig, setNotifConfig] = useState({
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: 'noreply@na2quiz.com',
    smtpPassword: '********',
    senderName: 'NA2 Quiz',
    senderEmail: 'noreply@na2quiz.com',
    pushEnabled: true,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    desktopEnabled: true
  });

  // Configuration de l'IA
  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    apiKey: 'sk-********************',
    model: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7,
    rateLimit: 100, // requêtes par minute
    cacheEnabled: true,
    cacheDuration: 3600 // secondes
  });

  // Configuration de la sécurité
  const [securityConfig, setSecurityConfig] = useState({
    jwtSecret: '********',
    jwtExpiresIn: '30d',
    refreshTokenExpiresIn: '7d',
    corsEnabled: true,
    corsOrigins: ['http://localhost:5173', 'https://na2quiz.com'],
    rateLimitEnabled: true,
    rateLimitMax: 100,
    rateLimitWindow: 900, // 15 minutes en secondes
    twoFactorRequired: false,
    ipWhitelist: [],
    ipBlacklist: []
  });

  // Configuration de la base de données
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: 27017,
    database: 'na2quiz',
    username: 'admin',
    password: '********',
    sslEnabled: true,
    replicaSet: '',
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '03:00',
    backupRetention: 30 // jours
  });

  // Configuration des performances
  const [perfConfig, setPerfConfig] = useState({
    cacheEnabled: true,
    cacheTTL: 3600,
    compressionEnabled: true,
    minifyAssets: true,
    lazyLoading: true,
    imageOptimization: true,
    maxUploadSize: 10, // MB
    concurrentUploads: 3,
    queryLimit: 100
  });

  // Configuration des paiements (optionnel)
  const [paymentConfig, setPaymentConfig] = useState({
    enabled: false,
    currency: 'EUR',
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalSecret: '',
    subscriptionPlans: [
      { name: 'Gratuit', price: 0, features: ['5 quiz/mois', 'Stats basiques'] },
      { name: 'Pro', price: 9.99, features: ['Quiz illimités', 'Stats avancées', 'Support prioritaire'] },
      { name: 'Premium', price: 19.99, features: ['Tout débloqué', 'API accès', 'Formation'] }
    ]
  });

  // Statistiques système
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    memoryUsage: '45%',
    cpuUsage: '23%',
    diskSpace: '156 GB / 500 GB',
    activeUsers: 42,
    totalRequests: 15420,
    avgResponseTime: '124ms',
    errorRate: '0.5%'
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [config, stats] = await Promise.all([
        getConfig().catch(() => ({})),
        getSystemStats().catch(() => ({}))
      ]);

      // Mettre à jour les états avec les données reçues
      if (config.general) setGeneral(prev => ({ ...prev, ...config.general }));
      if (config.user) setUserConfig(prev => ({ ...prev, ...config.user }));
      if (config.quiz) setQuizConfig(prev => ({ ...prev, ...config.quiz }));
      if (config.notifications) setNotifConfig(prev => ({ ...prev, ...config.notifications }));
      if (config.ai) setAiConfig(prev => ({ ...prev, ...config.ai }));
      if (config.security) setSecurityConfig(prev => ({ ...prev, ...config.security }));
      if (config.database) setDbConfig(prev => ({ ...prev, ...config.database }));
      if (config.performance) setPerfConfig(prev => ({ ...prev, ...config.performance }));
      if (config.payment) setPaymentConfig(prev => ({ ...prev, ...config.payment }));
      
      if (stats) setSystemStats(prev => ({ ...prev, ...stats }));

    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      toast.error('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        general,
        user: userConfig,
        quiz: quizConfig,
        notifications: notifConfig,
        ai: aiConfig,
        security: securityConfig,
        database: dbConfig,
        performance: perfConfig,
        payment: paymentConfig
      };
      
      await updateConfig(configData);
      toast.success('Configuration sauvegardée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = async () => {
    try {
      await resetConfig();
      toast.success('Configuration réinitialisée');
      setShowResetConfirm(false);
      fetchConfig();
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache vidé avec succès');
      setShowClearCacheConfirm(false);
    } catch (error) {
      toast.error('Erreur lors du nettoyage du cache');
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: <Settings size={18} /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
    { id: 'quizzes', label: 'Quiz', icon: <BookOpen size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'ai', label: 'Intelligence Artificielle', icon: <Cpu size={18} /> },
    { id: 'security', label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'database', label: 'Base de données', icon: <Database size={18} /> },
    { id: 'performance', label: 'Performance', icon: <Zap size={18} /> },
    { id: 'payment', label: 'Paiements', icon: <CreditCard size={18} /> },
    { id: 'system', label: 'Système', icon: <Server size={18} /> }
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <NavHome />
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              Retour
            </motion.button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
                Configuration
              </h1>
              <p style={{ color: '#94a3b8' }}>
                Paramètres système et préférences
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Sauvegarder
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
              Réinitialiser
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: activeTab === tab.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeTab === tab.id ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 12,
                color: activeTab === tab.id ? '#a5b4fc' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '0.9rem' }}>{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Contenu */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 24,
            padding: 32,
          }}
        >
          {/* GÉNÉRAL */}
          {activeTab === 'general' && (
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
                Paramètres généraux
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Nom du site
                  </label>
                  <input
                    value={general.siteName}
                    onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    URL du site
                  </label>
                  <input
                    value={general.siteUrl}
                    onChange={(e) => setGeneral({ ...general, siteUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Description du site
                  </label>
                  <textarea
                    value={general.siteDescription}
                    onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Email admin
                  </label>
                  <input
                    type="email"
                    value={general.adminEmail}
                    onChange={(e) => setGeneral({ ...general, adminEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Email support
                  </label>
                  <input
                    type="email"
                    value={general.supportEmail}
                    onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Fuseau horaire
                  </label>
                  <select
                    value={general.timezone}
                    onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  >
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Langue par défaut
                  </label>
                  <select
                    value={general.language}
                    onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={general.maintenanceMode}
                        onChange={(e) => setGeneral({ ...general, maintenanceMode: e.target.checked })}
                        style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                      />
                      <span style={{ color: '#f8fafc' }}>Mode maintenance</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={general.debugMode}
                        onChange={(e) => setGeneral({ ...general, debugMode: e.target.checked })}
                        style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                      />
                      <span style={{ color: '#f8fafc' }}>Mode debug</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UTILISATEURS */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
                Configuration des utilisateurs
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={userConfig.allowRegistration}
                      onChange={(e) => setUserConfig({ ...userConfig, allowRegistration: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Autoriser les inscriptions</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={userConfig.requireEmailVerification}
                      onChange={(e) => setUserConfig({ ...userConfig, requireEmailVerification: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Vérification email requise</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={userConfig.allowSocialLogin}
                      onChange={(e) => setUserConfig({ ...userConfig, allowSocialLogin: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Connexion sociale</span>
                  </label>
                </div>
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Rôle par défaut
                    </label>
                    <select
                      value={userConfig.defaultUserRole}
                      onChange={(e) => setUserConfig({ ...userConfig, defaultUserRole: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="formateur">Formateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Expiration session (minutes)
                    </label>
                    <input
                      type="number"
                      value={userConfig.sessionTimeout}
                      onChange={(e) => setUserConfig({ ...userConfig, sessionTimeout: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    />
                  </div>
                </div>
              </div>

              <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginTop: 24, marginBottom: 16 }}>
                Politique de mot de passe
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Longueur minimale
                  </label>
                  <input
                    type="number"
                    value={userConfig.passwordMinLength}
                    onChange={(e) => setUserConfig({ ...userConfig, passwordMinLength: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userConfig.passwordRequireUppercase}
                      onChange={(e) => setUserConfig({ ...userConfig, passwordRequireUppercase: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Majuscule requise</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userConfig.passwordRequireNumbers}
                      onChange={(e) => setUserConfig({ ...userConfig, passwordRequireNumbers: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Chiffre requis</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userConfig.passwordRequireSpecial}
                      onChange={(e) => setUserConfig({ ...userConfig, passwordRequireSpecial: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Caractère spécial requis</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {activeTab === 'quizzes' && (
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
                Configuration des quiz
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Questions min par quiz
                  </label>
                  <input
                    type="number"
                    value={quizConfig.minQuestionsPerQuiz}
                    onChange={(e) => setQuizConfig({ ...quizConfig, minQuestionsPerQuiz: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Questions max par quiz
                  </label>
                  <input
                    type="number"
                    value={quizConfig.maxQuestionsPerQuiz}
                    onChange={(e) => setQuizConfig({ ...quizConfig, maxQuestionsPerQuiz: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Durée par défaut (minutes)
                  </label>
                  <input
                    type="number"
                    value={quizConfig.defaultQuizDuration}
                    onChange={(e) => setQuizConfig({ ...quizConfig, defaultQuizDuration: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Durée maximale (minutes)
                  </label>
                  <input
                    type="number"
                    value={quizConfig.maxQuizDuration}
                    onChange={(e) => setQuizConfig({ ...quizConfig, maxQuizDuration: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={quizConfig.allowPublicQuizzes}
                      onChange={(e) => setQuizConfig({ ...quizConfig, allowPublicQuizzes: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Autoriser les quiz publics</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={quizConfig.requireApproval}
                      onChange={(e) => setQuizConfig({ ...quizConfig, requireApproval: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Approbation requise</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
                Configuration des notifications
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={notifConfig.emailEnabled}
                      onChange={(e) => setNotifConfig({ ...notifConfig, emailEnabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Activer les emails</span>
                  </label>
                  {notifConfig.emailEnabled && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                          Serveur SMTP
                        </label>
                        <input
                          value={notifConfig.smtpHost}
                          onChange={(e) => setNotifConfig({ ...notifConfig, smtpHost: e.target.value })}
                          style={{
                            width: '100%',
                            padding: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 8,
                            color: '#f8fafc',
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                          Port SMTP
                        </label>
                        <input
                          type="number"
                          value={notifConfig.smtpPort}
                          onChange={(e) => setNotifConfig({ ...notifConfig, smtpPort: parseInt(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: 8,
                            color: '#f8fafc',
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={notifConfig.pushEnabled}
                      onChange={(e) => setNotifConfig({ ...notifConfig, pushEnabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Notifications push</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      checked={notifConfig.desktopEnabled}
                      onChange={(e) => setNotifConfig({ ...notifConfig, desktopEnabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Notifications desktop</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SYSTÈME */}
          {activeTab === 'system' && (
            <div>
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
                Statistiques système
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <div style={{
                  padding: 20,
                  background: 'rgba(99,102,241,0.1)',
                  borderRadius: 16,
                }}>
                  <Server size={24} color="#6366f1" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Uptime</p>
                  <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600 }}>{systemStats.uptime}</p>
                </div>
                <div style={{
                  padding: 20,
                  background: 'rgba(16,185,129,0.1)',
                  borderRadius: 16,
                }}>
                  <Cpu size={24} color="#10b981" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>CPU</p>
                  <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600 }}>{systemStats.cpuUsage}</p>
                </div>
                <div style={{
                  padding: 20,
                  background: 'rgba(245,158,11,0.1)',
                  borderRadius: 16,
                }}>
                  <HardDrive size={24} color="#f59e0b" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Mémoire</p>
                  <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600 }}>{systemStats.memoryUsage}</p>
                </div>
                <div style={{
                  padding: 20,
                  background: 'rgba(139,92,246,0.1)',
                  borderRadius: 16,
                }}>
                  <Database size={24} color="#8b5cf6" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>Espace disque</p>
                  <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600 }}>{systemStats.diskSpace}</p>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
                  Actions système
                </h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowClearCacheConfirm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                    Vider le cache
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 8,
                      color: '#a5b4fc',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={16} />
                    Télécharger les logs
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* MODAL RÉINITIALISATION */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
              }}
            >
              <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Réinitialiser la configuration
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Cette action remettra tous les paramètres à leurs valeurs par défaut.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetConfig}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VIDER CACHE */}
      <AnimatePresence>
        {showClearCacheConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
              }}
            >
              <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: 16 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Vider le cache
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Cette action supprimera toutes les données en cache. Les performances pourraient être temporairement affectées.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowClearCacheConfirm(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleClearCache}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid #f59e0b',
                    borderRadius: 8,
                    color: '#f59e0b',
                    cursor: 'pointer',
                  }}
                >
                  Vider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminConfig;