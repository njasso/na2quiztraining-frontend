// src/pages/Admin/AdminConfig.jsx — VERSION CORRIGÉE (cohérente avec le backend)
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
  Link, Key, Server, Cloud, Wifi, Power, ToggleLeft,
  Home, Smartphone, Wallet, Check, X
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // ─── CONFIGURATION ÉDITABLE ───
  const [general, setGeneral] = useState({
    siteName: 'NA2 Quiz',
    siteDescription: 'Plateforme de quiz éducatifs',
    siteUrl: 'https://na2quiz.com',
    adminEmail: 'admin@na2quiz.com',
    supportEmail: 'support@na2quiz.com',
    timezone: 'Africa/Douala',
    language: 'fr',
    maintenanceMode: false,
  });

  const [userConfig, setUserConfig] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'user',
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    allowSocialLogin: true,
    allowGuestLogin: false,
  });

  const [quizConfig, setQuizConfig] = useState({
    maxQuestionsPerQuiz: 100,
    minQuestionsPerQuiz: 1,
    allowPublicQuizzes: true,
    requireQuestionApproval: false,
    defaultQuizDurationMin: 30,
    maxQuizDurationMin: 120,
    shuffleQuestionsDefault: true,
    shuffleAnswersDefault: true,
  });

  const [notifConfig, setNotifConfig] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
  });

  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    model: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7,
    rateLimitPerMinute: 20,
  });

  const [securityConfig, setSecurityConfig] = useState({
    rateLimitEnabled: true,
    rateLimitMaxPerWindow: 200,
    rateLimitWindowMinutes: 15,
    twoFactorRequiredForAdmin: false,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    enabled: true,
    currency: 'XAF',
    allowFreeTrial: true,
    freeTrialDays: 7,
  });

  // ─── SYSTÈME (LECTURE SEULE) ───
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    memoryUsage: '45%',
    cpuUsage: '23%',
    diskSpace: '156 GB / 500 GB',
    activeUsers: 0,
    totalRequests: 0,
    avgResponseTime: '124ms',
    errorRate: '0.5%',
  });

  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    services: {},
  });

  // ✅ Correspondance exacte avec le backend : cloudinary, campay, email, ai, database
  const [integrations, setIntegrations] = useState({
    cloudinary: { configured: false, note: '' },
    campay: { configured: false, environment: 'sandbox', webhookSecured: false },
    email: { configured: false },
    ai: { configured: false },
    database: { configured: false, connected: false, name: null, host: null },
  });

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchConfig();
  }, []);

  // ─── FETCH CONFIG ───
  const fetchConfig = async () => {
    setLoading(true);
    try {
      let configData = {};
      let statsData = {};
      let healthData = {};
      let integrationsData = {};

      try {
        const res = await getConfig();
        // Robustesse : getConfig peut retourner res.data ou directement le payload
        const payload = res?.data || res || {};
        configData = payload.config || {};
        integrationsData = payload.integrations || {};
      } catch (err) {
        console.warn('⚠️ getConfig:', err.message);
      }

      try {
        const res = await getSystemStats();
        const payload = res?.data || res || {};
        statsData = payload.stats || payload || {};
      } catch (err) {
        console.warn('⚠️ getSystemStats:', err.message);
      }

      try {
        const res = await getSystemHealth();
        healthData = res?.data || res || {};
      } catch (err) {
        console.warn('⚠️ getSystemHealth:', err.message);
      }

      // ── Mapping configuration éditable ──
      if (configData.general) setGeneral(prev => ({ ...prev, ...configData.general }));
      if (configData.users) setUserConfig(prev => ({ ...prev, ...configData.users }));
      if (configData.quiz) setQuizConfig(prev => ({ ...prev, ...configData.quiz }));
      if (configData.notifications) setNotifConfig(prev => ({ ...prev, ...configData.notifications }));
      if (configData.ai) setAiConfig(prev => ({ ...prev, ...configData.ai }));
      if (configData.security) setSecurityConfig(prev => ({ ...prev, ...configData.security }));
      if (configData.payments) setPaymentConfig(prev => ({ ...prev, ...configData.payments }));

      // ── Mapping intégrations (correspondance backend exacte) ──
      if (integrationsData && Object.keys(integrationsData).length > 0) {
        setIntegrations(prev => ({
          ...prev,
          cloudinary: integrationsData.cloudinary || prev.cloudinary,
          campay: integrationsData.campay || prev.campay,
          email: integrationsData.email || prev.email,
          ai: integrationsData.ai || prev.ai,
          database: integrationsData.database || prev.database,
        }));
      }

      // ── Mapping stats système ──
      if (statsData) {
        setSystemStats(prev => ({
          ...prev,
          uptime: statsData.system?.uptime ? `${Math.floor(statsData.system.uptime / 3600)}h` : prev.uptime,
          memoryUsage: statsData.system?.memoryUsage?.heapUsed ? `${statsData.system.memoryUsage.heapUsed} MB` : prev.memoryUsage,
          activeUsers: statsData.users?.activeToday ?? prev.activeUsers,
        }));
      }

      // ── Mapping santé ──
      if (healthData) {
        setSystemHealth({
          status: healthData.status || 'unknown',
          services: healthData.services || {},
        });
      }

    } catch (error) {
      console.error('❌ Erreur chargement configuration:', error);
      toast.error('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  // ─── VALIDATION ───
  const validateConfig = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(general.adminEmail)) newErrors.adminEmail = 'Email admin invalide';
    if (!emailRegex.test(general.supportEmail)) newErrors.supportEmail = 'Email support invalide';

    try {
      new URL(general.siteUrl);
    } catch {
      newErrors.siteUrl = 'URL invalide';
    }

    if (userConfig.sessionTimeoutMinutes < 5 || userConfig.sessionTimeoutMinutes > 1440) {
      newErrors.sessionTimeout = 'Session entre 5 et 1440 min';
    }
    if (userConfig.passwordMinLength < 6 || userConfig.passwordMinLength > 64) {
      newErrors.passwordMinLength = 'Longueur entre 6 et 64';
    }
    if (quizConfig.maxQuestionsPerQuiz < quizConfig.minQuestionsPerQuiz) {
      newErrors.quizQuestions = 'Max doit être > min';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveConfig = () => {
    if (!validateConfig()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setShowSaveConfirm(false);
    try {
      const payload = {
        general,
        users: userConfig,
        quiz: quizConfig,
        notifications: notifConfig,
        ai: aiConfig,
        security: securityConfig,
        payments: paymentConfig,
      };
      await updateConfig(payload);
      toast.success('✅ Configuration sauvegardée');
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      if (error.response?.status === 401) {
        toast.error('Session expirée');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('Accès non autorisé');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Valeur invalide');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
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
      if (error.response?.status === 403) {
        toast.error('Réservé au superadmin');
      } else {
        toast.error('Erreur lors de la réinitialisation');
      }
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await clearCache();
      toast.success(res.data?.message || 'Cache vidé');
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
    { id: 'ai', label: 'IA', icon: <Cpu size={18} /> },
    { id: 'security', label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'payment', label: 'Paiements', icon: <Wallet size={18} /> },
    { id: 'system', label: 'Système', icon: <Server size={18} /> },
  ];

  const inputStyle = (errKey) => ({
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${errors[errKey] ? '#ef4444' : 'rgba(99,102,241,0.2)'}`,
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: '0.9rem',
    outline: 'none',
  });

  const labelStyle = { color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 };
  const checkboxWrapper = { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' };

  const sectionTitle = (text) => (
    <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 24 }}>
      {text}
    </h2>
  );

  // ─── BADGE INTÉGRATION ───
  const StatusBadge = ({ active, label }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: '0.7rem',
      fontWeight: 600,
      background: active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      {active ? <Check size={10} /> : <X size={10} />}
      {label}
    </span>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
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
      <NavHome />
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Retour
            </motion.button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>Configuration</h1>
              <p style={{ color: '#94a3b8' }}>Paramètres système et préférences</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveConfig}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
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
              {saving ? <><RefreshCw size={16} className="animate-spin" /> Sauvegarde...</> : <><Save size={16} /> Sauvegarder</>}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResetConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Réinitialiser
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
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
            minHeight: 400,
          }}
        >
          {/* ═══════════════════════════════════════ */}
          {/* GÉNÉRAL */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div>
              {sectionTitle('Paramètres généraux')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                <div>
                  <label style={labelStyle}>Nom du site *</label>
                  <input
                    value={general.siteName}
                    onChange={e => setGeneral({ ...general, siteName: e.target.value })}
                    style={inputStyle('siteName')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>URL du site *</label>
                  <input
                    value={general.siteUrl}
                    onChange={e => setGeneral({ ...general, siteUrl: e.target.value })}
                    style={inputStyle('siteUrl')}
                  />
                  {errors.siteUrl && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.siteUrl}</p>}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={general.siteDescription}
                    onChange={e => setGeneral({ ...general, siteDescription: e.target.value })}
                    rows={2}
                    style={{ ...inputStyle(), resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email admin *</label>
                  <input
                    type="email"
                    value={general.adminEmail}
                    onChange={e => setGeneral({ ...general, adminEmail: e.target.value })}
                    style={inputStyle('adminEmail')}
                  />
                  {errors.adminEmail && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.adminEmail}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email support *</label>
                  <input
                    type="email"
                    value={general.supportEmail}
                    onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
                    style={inputStyle('supportEmail')}
                  />
                  {errors.supportEmail && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.supportEmail}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Fuseau horaire</label>
                  <select
                    value={general.timezone}
                    onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                    style={inputStyle()}
                  >
                    <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                    <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Langue</label>
                  <select
                    value={general.language}
                    onChange={e => setGeneral({ ...general, language: e.target.value })}
                    style={inputStyle()}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={general.maintenanceMode}
                      onChange={e => setGeneral({ ...general, maintenanceMode: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Mode maintenance</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* UTILISATEURS */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div>
              {sectionTitle('Configuration des utilisateurs')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'allowRegistration', label: 'Autoriser les inscriptions' },
                    { key: 'requireEmailVerification', label: 'Vérification email requise' },
                    { key: 'allowSocialLogin', label: 'Connexion sociale' },
                    { key: 'allowGuestLogin', label: 'Connexion invité' },
                  ].map(item => (
                    <label key={item.key} style={checkboxWrapper}>
                      <input
                        type="checkbox"
                        checked={userConfig[item.key]}
                        onChange={e => setUserConfig({ ...userConfig, [item.key]: e.target.checked })}
                        style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                      />
                      <span style={{ color: '#f8fafc' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Rôle par défaut</label>
                    <select
                      value={userConfig.defaultUserRole}
                      onChange={e => setUserConfig({ ...userConfig, defaultUserRole: e.target.value })}
                      style={inputStyle()}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="formateur">Formateur</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Expiration session (min) *</label>
                    <input
                      type="number"
                      value={userConfig.sessionTimeoutMinutes}
                      onChange={e => setUserConfig({ ...userConfig, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
                      style={inputStyle('sessionTimeout')}
                    />
                    {errors.sessionTimeout && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.sessionTimeout}</p>}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Tentatives max de connexion</label>
                    <input
                      type="number"
                      value={userConfig.maxLoginAttempts}
                      onChange={e => setUserConfig({ ...userConfig, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                      style={inputStyle()}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Durée verrouillage (min)</label>
                    <input
                      type="number"
                      value={userConfig.lockoutDurationMinutes}
                      onChange={e => setUserConfig({ ...userConfig, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                      style={inputStyle()}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Longueur min mot de passe *</label>
                    <input
                      type="number"
                      value={userConfig.passwordMinLength}
                      onChange={e => setUserConfig({ ...userConfig, passwordMinLength: parseInt(e.target.value) || 8 })}
                      style={inputStyle('passwordMinLength')}
                    />
                    {errors.passwordMinLength && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.passwordMinLength}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'passwordRequireUppercase', label: 'Majuscule requise' },
                      { key: 'passwordRequireNumbers', label: 'Chiffre requis' },
                      { key: 'passwordRequireSpecial', label: 'Caractère spécial requis' },
                    ].map(item => (
                      <label key={item.key} style={checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={userConfig[item.key]}
                          onChange={e => setUserConfig({ ...userConfig, [item.key]: e.target.checked })}
                          style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                        />
                        <span style={{ color: '#f8fafc' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* QUIZ */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'quizzes' && (
            <div>
              {sectionTitle('Configuration des quiz')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                <div>
                  <label style={labelStyle}>Questions min</label>
                  <input
                    type="number"
                    value={quizConfig.minQuestionsPerQuiz}
                    onChange={e => setQuizConfig({ ...quizConfig, minQuestionsPerQuiz: parseInt(e.target.value) || 1 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Questions max *</label>
                  <input
                    type="number"
                    value={quizConfig.maxQuestionsPerQuiz}
                    onChange={e => setQuizConfig({ ...quizConfig, maxQuestionsPerQuiz: parseInt(e.target.value) || 100 })}
                    style={inputStyle('quizQuestions')}
                  />
                  {errors.quizQuestions && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.quizQuestions}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Durée par défaut (min)</label>
                  <input
                    type="number"
                    value={quizConfig.defaultQuizDurationMin}
                    onChange={e => setQuizConfig({ ...quizConfig, defaultQuizDurationMin: parseInt(e.target.value) || 30 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Durée max (min)</label>
                  <input
                    type="number"
                    value={quizConfig.maxQuizDurationMin}
                    onChange={e => setQuizConfig({ ...quizConfig, maxQuizDurationMin: parseInt(e.target.value) || 120 })}
                    style={inputStyle()}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { key: 'allowPublicQuizzes', label: 'Quiz publics autorisés' },
                      { key: 'requireQuestionApproval', label: 'Approbation requise' },
                      { key: 'shuffleQuestionsDefault', label: 'Mélanger questions par défaut' },
                      { key: 'shuffleAnswersDefault', label: 'Mélanger réponses par défaut' },
                    ].map(item => (
                      <label key={item.key} style={checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={quizConfig[item.key]}
                          onChange={e => setQuizConfig({ ...quizConfig, [item.key]: e.target.checked })}
                          style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                        />
                        <span style={{ color: '#f8fafc' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* NOTIFICATIONS */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <div>
              {sectionTitle('Configuration des notifications')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'emailEnabled', label: 'Emails activés', icon: <Mail size={16} color="#6366f1" /> },
                    { key: 'pushEnabled', label: 'Push activés', icon: <Bell size={16} color="#10b981" /> },
                    { key: 'smsEnabled', label: 'SMS activés', icon: <Smartphone size={16} color="#f59e0b" /> },
                  ].map(item => (
                    <label key={item.key} style={checkboxWrapper}>
                      <input
                        type="checkbox"
                        checked={notifConfig[item.key]}
                        onChange={e => setNotifConfig({ ...notifConfig, [item.key]: e.target.checked })}
                        style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                      />
                      <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.icon} {item.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>
                    <Cloud size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Intégration SMTP
                  </p>
                  <StatusBadge active={integrations.email?.configured} label={integrations.email?.configured ? 'Configuré' : 'Non configuré'} />
                  <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 8 }}>
                    Les identifiants SMTP restent dans les variables d'environnement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* IA */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'ai' && (
            <div>
              {sectionTitle('Configuration de l\'IA')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                <div>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={aiConfig.enabled}
                      onChange={e => setAiConfig({ ...aiConfig, enabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Activer l'IA</span>
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Modèle</label>
                  <select
                    value={aiConfig.model}
                    onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
                    style={inputStyle()}
                  >
                    <option value="deepseek-chat">DeepSeek Chat</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Max tokens</label>
                  <input
                    type="number"
                    value={aiConfig.maxTokens}
                    onChange={e => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) || 2000 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Température (0–1.5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1.5"
                    value={aiConfig.temperature}
                    onChange={e => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) || 0.7 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Limite requêtes/min</label>
                  <input
                    type="number"
                    value={aiConfig.rateLimitPerMinute}
                    onChange={e => setAiConfig({ ...aiConfig, rateLimitPerMinute: parseInt(e.target.value) || 20 })}
                    style={inputStyle()}
                  />
                </div>
                <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>
                    <Key size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Clé API IA
                  </p>
                  <StatusBadge active={integrations.ai?.configured} label={integrations.ai?.configured ? 'Clé configurée' : 'Non configurée'} />
                  <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 8 }}>
                    Gérée par la variable d'environnement DEEPSEEK_API_KEY ou OPENAI_API_KEY.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SÉCURITÉ */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div>
              {sectionTitle('Configuration de la sécurité')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={securityConfig.rateLimitEnabled}
                      onChange={e => setSecurityConfig({ ...securityConfig, rateLimitEnabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Limitation de requêtes</span>
                  </label>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={securityConfig.twoFactorRequiredForAdmin}
                      onChange={e => setSecurityConfig({ ...securityConfig, twoFactorRequiredForAdmin: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>2FA requis pour admin</span>
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Max requêtes / fenêtre</label>
                  <input
                    type="number"
                    value={securityConfig.rateLimitMaxPerWindow}
                    onChange={e => setSecurityConfig({ ...securityConfig, rateLimitMaxPerWindow: parseInt(e.target.value) || 200 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fenêtre (minutes)</label>
                  <input
                    type="number"
                    value={securityConfig.rateLimitWindowMinutes}
                    onChange={e => setSecurityConfig({ ...securityConfig, rateLimitWindowMinutes: parseInt(e.target.value) || 15 })}
                    style={inputStyle()}
                  />
                </div>
                <div style={{ padding: 16, background: 'rgba(239,68,68,0.05)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.1)' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>
                    <Lock size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Secrets (JWT, clés API)
                  </p>
                  <StatusBadge active={false} label="Uniquement en variables d'environnement" />
                  <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 8 }}>
                    Aucun secret n'est stocké en base ni affiché ici.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* PAIMENTS — CAMPAY */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'payment' && (
            <div>
              {sectionTitle('Configuration des paiements (Campay)')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                <div>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={paymentConfig.enabled}
                      onChange={e => setPaymentConfig({ ...paymentConfig, enabled: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Activer les paiements</span>
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Devise</label>
                  <select
                    value={paymentConfig.currency}
                    onChange={e => setPaymentConfig({ ...paymentConfig, currency: e.target.value })}
                    style={inputStyle()}
                    disabled={!paymentConfig.enabled}
                  >
                    <option value="XAF">XAF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Essai gratuit (jours)</label>
                  <input
                    type="number"
                    disabled={!paymentConfig.enabled}
                    value={paymentConfig.freeTrialDays}
                    onChange={e => setPaymentConfig({ ...paymentConfig, freeTrialDays: parseInt(e.target.value) || 7 })}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={checkboxWrapper}>
                    <input
                      type="checkbox"
                      disabled={!paymentConfig.enabled}
                      checked={paymentConfig.allowFreeTrial}
                      onChange={e => setPaymentConfig({ ...paymentConfig, allowFreeTrial: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Autoriser essai gratuit</span>
                  </label>
                </div>

                {/* Statut Campay */}
                <div style={{
                  gridColumn: 'span 2',
                  padding: 20,
                  background: 'rgba(16,185,129,0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(16,185,129,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Smartphone size={24} color="#10b981" />
                    <div>
                      <p style={{ color: '#f8fafc', fontWeight: 600 }}>Campay Mobile Money</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Orange Money & MTN Mobile Money</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <StatusBadge active={integrations.campay?.configured} label={integrations.campay?.configured ? 'Campay configuré' : 'Campay non configuré'} />
                    <StatusBadge active={paymentConfig.enabled} label={paymentConfig.enabled ? 'Paiements actifs' : 'Paiements désactivés'} />
                    {integrations.campay?.configured && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                        background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
                      }}>
                        {integrations.campay.environment === 'production' ? '🌍 Production' : '🧪 Sandbox'}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    Les clés Campay (CAMPAY_APP_USERNAME, CAMPAY_APP_PASSWORD) sont définies dans les variables d'environnement.
                    {integrations.campay?.webhookSecured && ' Webhook sécurisé activé.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* SYSTÈME — LECTURE SEULE */}
          {/* ═══════════════════════════════════════ */}
          {activeTab === 'system' && (
            <div>
              {sectionTitle('Statistiques système')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                {[
                  { label: 'Disponibilité', value: systemStats.uptime, icon: <Server size={24} color="#6366f1" />, color: '#6366f1' },
                  { label: 'CPU', value: systemStats.cpuUsage, icon: <Cpu size={24} color="#10b981" />, color: '#10b981' },
                  { label: 'Mémoire', value: systemStats.memoryUsage, icon: <HardDrive size={24} color="#f59e0b" />, color: '#f59e0b' },
                  { label: 'Espace disque', value: systemStats.diskSpace, icon: <Database size={24} color="#8b5cf6" />, color: '#8b5cf6' },
                  { label: 'Utilisateurs actifs', value: systemStats.activeUsers, icon: <Users size={24} color="#06b6d4" />, color: '#06b6d4' },
                  { label: 'Requêtes totales', value: systemStats.totalRequests, icon: <Zap size={24} color="#ec4899" />, color: '#ec4899' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: 20,
                    background: `${stat.color}15`,
                    borderRadius: 16,
                    border: `1px solid ${stat.color}20`,
                  }}>
                    {stat.icon}
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 8, marginBottom: 2 }}>{stat.label}</p>
                    <p style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Intégrations */}
              <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
                Intégrations & Services
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { name: 'MongoDB', active: integrations.database?.connected, icon: <Database size={18} />, detail: integrations.database?.host },
                  { name: 'Cloudinary', active: integrations.cloudinary?.configured, icon: <Cloud size={18} />, detail: integrations.cloudinary?.note },
                  { name: 'Campay', active: integrations.campay?.configured, icon: <Smartphone size={18} />, detail: integrations.campay?.environment },
                  { name: 'SMTP', active: integrations.email?.configured, icon: <Mail size={18} />, detail: null },
                ].map(int => (
                  <div key={int.name} style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    border: '1px solid rgba(99,102,241,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {int.icon} {int.name}
                      </span>
                      <StatusBadge active={int.active} label={int.active ? 'Connecté' : 'Déconnecté'} />
                    </div>
                    {int.detail && (
                      <p style={{ color: '#64748b', fontSize: '0.7rem', margin: 0 }}>
                        {int.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Santé */}
              <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
                Santé du système
              </h3>
              <div style={{
                padding: 16,
                borderRadius: 12,
                background: systemHealth.status === 'UP' || systemHealth.status === 'healthy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${systemHealth.status === 'UP' || systemHealth.status === 'healthy' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}>
                {systemHealth.status === 'UP' || systemHealth.status === 'healthy' ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <AlertTriangle size={24} color="#ef4444" />
                )}
                <div>
                  <p style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {systemHealth.status === 'UP' || systemHealth.status === 'healthy' ? '✅ Tout va bien' : `⚠️ Statut: ${systemHealth.status}`}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    Dernier check: {new Date().toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
                Actions système
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClearCacheConfirm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 8,
                    color: '#f59e0b',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} /> Vider le cache
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchConfig}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={16} /> Rafraîchir
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* ═══════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════ */}

      {/* Réinitialisation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                Tous les paramètres reviendront à leurs valeurs par défaut.
                <br />
                <strong style={{ color: '#ef4444' }}>Réservé au superadmin.</strong>
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setShowResetConfirm(false)} style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
                }}>Annuler</button>
                <button onClick={handleResetConfig} style={{
                  padding: '10px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', cursor: 'pointer',
                }}>Réinitialiser</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vider cache */}
      <AnimatePresence>
        {showClearCacheConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                border: '1px solid rgba(245,158,11,0.3)',
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
                Toutes les données en cache seront supprimées.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setShowClearCacheConfirm(false)} style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
                }}>Annuler</button>
                <button onClick={handleClearCache} style={{
                  padding: '10px 24px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 8, color: '#f59e0b', cursor: 'pointer',
                }}>Vider</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sauvegarde */}
      <AnimatePresence>
        {showSaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
              }}
            >
              <CheckCircle size={48} color="#10b981" style={{ marginBottom: 16 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Sauvegarder ?
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Confirmer l'enregistrement des modifications.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setShowSaveConfirm(false)} style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
                }}>Annuler</button>
                <button onClick={confirmSave} style={{
                  padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600,
                }}>Sauvegarder</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminConfig;