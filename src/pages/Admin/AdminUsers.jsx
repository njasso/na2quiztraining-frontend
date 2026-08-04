// src/pages/Admin/AdminUsers.jsx - VERSION CORRIGÉE

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, MoreVertical, Edit2, Trash2,
  UserPlus, Mail, Calendar, Shield, Award, Star,
  ChevronLeft, ChevronRight, Download, Upload, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Eye, Lock, Unlock,
  Crown, UserCog, UserX, UserCheck, Settings, BarChart,
  Phone, MapPin, Globe, Briefcase, Link as LinkIcon,
  Key, ShieldCheck, UserMinus, UserPlus as UserPlusIcon,
  Clock, Activity, Smartphone, Monitor
} from 'lucide-react';
import {
  getUsers,
  deleteUser,
  updateUser,
  getUserStats,
  getUserAchievements,
  sendNotification,
  exportUserData,
  importData,
  createUser,
  resetUserPassword,
  lockUserAccount,
  unlockUserAccount,
  getUserSessions,
  revokeUserSession,
  getUserLoginHistory
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import NavHome from '../../components/NavHome';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États principaux
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // États des modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // États pour les actions en cours
  const [lockingUserId, setLockingUserId] = useState(null);
  const [unlockingUserId, setUnlockingUserId] = useState(null);
  
  // Statistiques utilisateur sélectionné
  const [userStats, setUserStats] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [userLoginHistory, setUserLoginHistory] = useState([]);

  // Formulaire de création
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    niveau: 'Débutant',
    phone: '',
    country: '',
    city: ''
  });

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    niveau: 'Débutant',
    bio: '',
    avatar: '',
    phone: '',
    country: '',
    city: '',
    occupation: '',
    website: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      facebook: ''
    },
    emailVerified: false,
    isLocked: false,
    badges: []
  });

  // Formulaire de réinitialisation de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Formulaire de notification
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    type: 'info',
    sendToAll: false
  });

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  // --- FETCH USERS ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers({
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      let usersList = [];
      let total = 0;
      
      if (Array.isArray(response)) {
        usersList = response;
        total = response.length;
      } else if (response?.users && Array.isArray(response.users)) {
        usersList = response.users;
        total = response.total || response.pagination?.total || response.users.length;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          usersList = response.data;
          total = response.data.length;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersList = response.data.users;
          total = response.data.total || response.data.users.length;
        }
      }
      
      // S'assurer que chaque utilisateur a un id et isLocked
      usersList = usersList.map(u => ({
        ...u,
        id: u.id || u._id,
        isLocked: u.isLocked || false
      }));
      
      setUsers(usersList);
      setTotalUsers(total);
      
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      toast.error('Impossible de charger les utilisateurs');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, usersPerPage, searchTerm, roleFilter, statusFilter]);

  // --- GESTION DES VERROUILLAGES (CORRIGÉE) ---

  const handleLockUser = async (userId) => {
    // Éviter les clics multiples
    if (lockingUserId) return;
    
    setLockingUserId(userId);
    
    try {
      // 1. Mise à jour IMMÉDIATE de l'UI
      setUsers(prevUsers => 
        prevUsers.map(u => 
          (u.id === userId || u._id === userId) 
            ? { ...u, isLocked: true } 
            : u
        )
      );
      
      // 2. Appel API
      await lockUserAccount(userId);
      
      // 3. Message de succès
      toast.success('Compte verrouillé avec succès');
      
      // 4. Rafraîchir pour être sûr (optionnel mais recommandé)
      await fetchUsers();
      
    } catch (error) {
      console.error('❌ Erreur lockUserAccount:', error);
      
      // 5. Annuler la mise à jour en cas d'erreur
      await fetchUsers();
      
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du verrouillage';
      toast.error(errorMessage);
    } finally {
      setLockingUserId(null);
    }
  };

  const handleUnlockUser = async (userId) => {
    // Éviter les clics multiples
    if (unlockingUserId) return;
    
    setUnlockingUserId(userId);
    
    try {
      // 1. Mise à jour IMMÉDIATE de l'UI
      setUsers(prevUsers => 
        prevUsers.map(u => 
          (u.id === userId || u._id === userId) 
            ? { ...u, isLocked: false } 
            : u
        )
      );
      
      // 2. Appel API
      await unlockUserAccount(userId);
      
      // 3. Message de succès
      toast.success('Compte déverrouillé avec succès');
      
      // 4. Rafraîchir pour être sûr (optionnel mais recommandé)
      await fetchUsers();
      
    } catch (error) {
      console.error('❌ Erreur unlockUserAccount:', error);
      
      // 5. Annuler la mise à jour en cas d'erreur
      await fetchUsers();
      
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors du déverrouillage';
      toast.error(errorMessage);
    } finally {
      setUnlockingUserId(null);
    }
  };

  // --- RESTE DU CODE IDENTIQUE ---
  // ... (toutes les autres fonctions restent inchangées)

  const handleCreateUser = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (createForm.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const newUser = await createUser({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        niveau: createForm.niveau,
        phone: createForm.phone,
        country: createForm.country,
        city: createForm.city,
        emailVerified: true
      });
      
      toast.success(`Utilisateur ${createForm.firstName} ${createForm.lastName} créé avec succès`);
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        niveau: 'Débutant',
        phone: '',
        country: '',
        city: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    try {
      const [stats, achievements] = await Promise.all([
        getUserStats(user.id),
        getUserAchievements(user.id)
      ]);
      setUserStats(stats);
      setUserAchievements(achievements);
      setShowStatsModal(true);
    } catch (error) {
      toast.error('Erreur chargement des statistiques');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'user',
      niveau: user.niveau || 'Débutant',
      bio: user.bio || '',
      avatar: user.avatar || '',
      phone: user.phone || '',
      country: user.country || '',
      city: user.city || '',
      occupation: user.occupation || '',
      website: user.website || '',
      socialLinks: user.socialLinks || {
        twitter: '', linkedin: '', github: '', facebook: ''
      },
      emailVerified: user.emailVerified || false,
      isLocked: user.isLocked || false,
      badges: user.badges || []
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await updateUser(selectedUser.id, editForm);
      toast.success('Utilisateur mis à jour avec succès');
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser.id);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // --- GESTION DES MOTS DE PASSE ---

  const handleResetPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, passwordForm.newPassword);
      toast.success('Mot de passe réinitialisé avec succès');
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  // --- GESTION DES SESSIONS ---

  const handleViewSessions = async (user) => {
    setSelectedUser(user);
    try {
      const [sessions, history] = await Promise.all([
        getUserSessions(user.id),
        getUserLoginHistory(user.id)
      ]);
      setUserSessions(sessions || []);
      setUserLoginHistory(history || []);
      setShowSessionsModal(true);
    } catch (error) {
      toast.error('Erreur chargement des sessions');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeUserSession(selectedUser.id, sessionId);
      toast.success('Session révoquée avec succès');
      const sessions = await getUserSessions(selectedUser.id);
      setUserSessions(sessions);
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Révoquer toutes les sessions de cet utilisateur ?')) return;
    
    try {
      await revokeUserSession(selectedUser.id, 'all');
      toast.success('Toutes les sessions ont été révoquées');
      setUserSessions([]);
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    }
  };

  // --- NOTIFICATIONS ---

  const handleSendNotification = async () => {
    try {
      if (notifyForm.sendToAll) {
        await sendNotification({
          ...notifyForm,
          broadcast: true
        });
        toast.success('Notification envoyée à tous les utilisateurs');
      } else {
        await sendNotification({
          ...notifyForm,
          userId: selectedUser.id
        });
        toast.success('Notification envoyée');
      }
      setShowNotifyModal(false);
      setNotifyForm({ title: '', message: '', type: 'info', sendToAll: false });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  // --- EXPORT / IMPORT ---

  const handleExportUsers = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleImportUsers = async (file) => {
    try {
      await importData('users', file);
      toast.success('Import réussi');
      setShowImportModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    }
  };

  // --- SÉLECTION MULTIPLE ---

  const handleToggleSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id || u._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Sélectionnez des utilisateurs');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Supprimer ${selectedUsers.length} utilisateurs ?`)) return;
      try {
        await Promise.all(selectedUsers.map(id => deleteUser(id)));
        toast.success(`${selectedUsers.length} utilisateurs supprimés`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    } else if (action === 'lock') {
      try {
        await Promise.all(selectedUsers.map(id => lockUserAccount(id)));
        toast.success(`${selectedUsers.length} comptes verrouillés`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        toast.error('Erreur lors du verrouillage');
      }
    } else if (action === 'unlock') {
      try {
        await Promise.all(selectedUsers.map(id => unlockUserAccount(id)));
        toast.success(`${selectedUsers.length} comptes déverrouillés`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        toast.error('Erreur lors du déverrouillage');
      }
    }
  };

  // --- UTILITAIRES D'AFFICHAGE ---

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: <Crown size={12} />, label: 'Admin' },
      superadmin: { bg: 'rgba(239,68,68,0.2)', color: '#dc2626', icon: <Crown size={12} />, label: 'Super Admin' },
      formateur: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: <Award size={12} />, label: 'Formateur' },
      user: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', icon: <UserCheck size={12} />, label: 'Utilisateur' }
    };
    return colors[role] || colors.user;
  };

  const getStatusBadge = (user) => {
    if (user.isLocked) {
      return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', text: 'Verrouillé', icon: <Lock size={12} /> };
    }
    if (user.emailVerified) {
      return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', text: 'Vérifié', icon: <CheckCircle size={12} /> };
    }
    return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', text: 'En attente', icon: <AlertTriangle size={12} /> };
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      <NavHome />
      
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Gestion des Utilisateurs
            </h1>
            <p style={{ color: '#94a3b8' }}>
              {totalUsers} utilisateurs au total • {users.filter(u => u.isLocked).length} verrouillés
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
            >
              <UserPlusIcon size={16} />
              Créer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImportModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 12,
                color: '#10b981',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} />
              Importer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportUsers}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12,
                color: '#a5b4fc',
                cursor: 'pointer',
              }}
            >
              <Download size={16} />
              Exporter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchUsers}
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
              <RefreshCw size={16} />
              Rafraîchir
            </motion.button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          >
            <option value="all">Tous les rôles</option>
            <option value="superadmin">Super Admins</option>
            <option value="admin">Administrateurs</option>
            <option value="formateur">Formateurs</option>
            <option value="user">Utilisateurs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="verified">Vérifiés</option>
            <option value="pending">En attente</option>
            <option value="locked">Verrouillés</option>
          </select>

          {/* Actions groupées */}
          {selectedUsers.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('lock')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                  color: '#f59e0b',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <Lock size={14} />
                Verrouiller
              </motion.button>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('unlock')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <Unlock size={14} />
                Déverrouiller
              </motion.button>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('delete')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <Trash2 size={14} />
                Supprimer ({selectedUsers.length})
              </motion.button>
            </div>
          )}
        </div>

        {/* Tableau des utilisateurs */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                  <th style={{ padding: '12px 16px', width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Utilisateur
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Rôle
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Niveau
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Statut
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Inscription
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                      <RefreshCw size={32} className="animate-spin" color="#6366f1" />
                      <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des utilisateurs...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                      <Users size={48} color="#1e293b" />
                      <p style={{ color: '#94a3b8', marginTop: 16 }}>Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const roleBadge = getRoleBadge(user.role);
                    const statusBadge = getStatusBadge(user);
                    const isCurrentUser = user.id === localStorage.getItem('userId');
                    const isLocking = lockingUserId === user.id || lockingUserId === user._id;
                    const isUnlocking = unlockingUserId === user.id || unlockingUserId === user._id;
                    
                    return (
                      <motion.tr
                        key={user.id || user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          borderBottom: '1px solid rgba(99,102,241,0.1)',
                          cursor: 'pointer',
                          opacity: user.isLocked ? 0.6 : 1,
                        }}
                        whileHover={{ background: 'rgba(99,102,241,0.05)' }}
                      >
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id || user._id)}
                            onChange={() => handleToggleSelect(user.id || user._id)}
                            disabled={isCurrentUser}
                            style={{ 
                              accentColor: '#6366f1', 
                              width: 16, 
                              height: 16,
                              opacity: isCurrentUser ? 0.3 : 1,
                              cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }} onClick={() => handleViewUser(user)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.firstName}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${user.isLocked ? '#64748b' : '#6366f1'}, ${user.isLocked ? '#475569' : '#8b5cf6'})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                              }}>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                            )}
                            <div>
                              <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                                {user.firstName} {user.lastName}
                                {isCurrentUser && (
                                  <span style={{ 
                                    marginLeft: 6,
                                    fontSize: '0.6rem',
                                    color: '#6366f1',
                                    background: 'rgba(99,102,241,0.15)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                  }}>Vous</span>
                                )}
                                {user.isLocked && (
                                  <span style={{ 
                                    marginLeft: 6,
                                    fontSize: '0.6rem',
                                    color: '#ef4444',
                                  }}>🔒</span>
                                )}
                              </p>
                              <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            background: roleBadge.bg,
                            border: `1px solid ${roleBadge.color}30`,
                            borderRadius: 10,
                            color: roleBadge.color,
                            fontSize: '0.65rem',
                          }}>
                            {roleBadge.icon}
                            {roleBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#f8fafc', fontSize: '0.8rem' }}>
                          {user.niveau || 'Non défini'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            background: statusBadge.bg,
                            border: `1px solid ${statusBadge.color}30`,
                            borderRadius: 10,
                            color: statusBadge.color,
                            fontSize: '0.65rem',
                          }}>
                            {statusBadge.icon}
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.75rem' }}>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                              style={{
                                padding: 4,
                                background: 'rgba(99,102,241,0.1)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 4,
                                color: '#a5b4fc',
                                cursor: 'pointer',
                              }}
                              title="Modifier"
                            >
                              <Edit2 size={12} />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowPasswordModal(true);
                              }}
                              style={{
                                padding: 4,
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: 4,
                                color: '#f59e0b',
                                cursor: 'pointer',
                              }}
                              title="Réinitialiser le mot de passe"
                            >
                              <Key size={12} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSessions(user);
                              }}
                              style={{
                                padding: 4,
                                background: 'rgba(139,92,246,0.1)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                borderRadius: 4,
                                color: '#8b5cf6',
                                cursor: 'pointer',
                              }}
                              title="Sessions"
                            >
                              <Monitor size={12} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowNotifyModal(true);
                              }}
                              style={{
                                padding: 4,
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                borderRadius: 4,
                                color: '#10b981',
                                cursor: 'pointer',
                              }}
                              title="Notification"
                            >
                              <Mail size={12} />
                            </motion.button>

                            {/* BOUTON VERROUILLER / DÉVERROUILLER AVEC ÉTAT DE CHARGEMENT */}
                            {!user.isLocked ? (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockUser(user.id || user._id);
                                }}
                                disabled={isLocking}
                                style={{
                                  padding: 4,
                                  background: 'rgba(245,158,11,0.1)',
                                  border: '1px solid rgba(245,158,11,0.2)',
                                  borderRadius: 4,
                                  color: '#f59e0b',
                                  cursor: isLocking ? 'not-allowed' : 'pointer',
                                  opacity: isLocking ? 0.5 : 1,
                                }}
                                title="Verrouiller"
                              >
                                {isLocking ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Lock size={12} />
                                )}
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlockUser(user.id || user._id);
                                }}
                                disabled={isUnlocking}
                                style={{
                                  padding: 4,
                                  background: 'rgba(16,185,129,0.1)',
                                  border: '1px solid rgba(16,185,129,0.2)',
                                  borderRadius: 4,
                                  color: '#10b981',
                                  cursor: isUnlocking ? 'not-allowed' : 'pointer',
                                  opacity: isUnlocking ? 0.5 : 1,
                                }}
                                title="Déverrouiller"
                              >
                                {isUnlocking ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Unlock size={12} />
                                )}
                              </motion.button>
                            )}

                            {!isCurrentUser && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                }}
                                style={{
                                  padding: 4,
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  borderRadius: 4,
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                }}
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 24,
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: currentPage === 1 ? '#4b5563' : '#94a3b8',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: currentPage === totalPages ? '#4b5563' : '#94a3b8',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* ============================================ */}
      {/* MODAL CRÉATION UTILISATEUR */}
      {/* ============================================ */}
      <AnimatePresence>
        {showCreateModal && (
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
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 550,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                Créer un utilisateur
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 20 }}>
                Remplissez les informations pour créer un nouveau compte
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Prénom <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                      placeholder="Prénom"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Nom <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      placeholder="Nom"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="exemple@email.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Mot de passe <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Confirmer <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={createForm.confirmPassword}
                      onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Rôle
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="formateur">Formateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Niveau
                    </label>
                    <select
                      value={createForm.niveau}
                      onChange={(e) => setCreateForm({ ...createForm, niveau: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Téléphone
                    </label>
                    <input
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+237 6XXXXXXXX"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Pays
                    </label>
                    <input
                      value={createForm.country}
                      onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                      placeholder="Cameroun"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                    Ville
                  </label>
                  <input
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    placeholder="Douala"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      role: 'user',
                      niveau: 'Débutant',
                      phone: '',
                      country: '',
                      city: ''
                    });
                  }}
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
                  onClick={handleCreateUser}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL ÉDITION UTILISATEUR */}
      {/* ============================================ */}
      <AnimatePresence>
        {showUserModal && (
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
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                Modifier l'utilisateur
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 20 }}>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </p>

              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Prénom
                    </label>
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Nom
                    </label>
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Rôle
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="formateur">Formateur</option>
                      <option value="admin">Administrateur</option>
                      <option value="superadmin">Super Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Niveau
                    </label>
                    <select
                      value={editForm.niveau}
                      onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Téléphone
                    </label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Avatar URL
                    </label>
                    <input
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Pays
                    </label>
                    <input
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                      Ville
                    </label>
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.emailVerified}
                      onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc', fontSize: '0.8rem' }}>Email vérifié</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.isLocked}
                      onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
                      style={{ accentColor: '#ef4444', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc', fontSize: '0.8rem' }}>Compte verrouillé</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => setShowUserModal(false)}
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
                  onClick={handleSaveUser}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL RÉINITIALISATION MOT DE PASSE */}
      {/* ============================================ */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
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
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 420,
                width: '90%',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Key size={40} color="#f59e0b" />
                <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, marginTop: 8 }}>
                  Réinitialiser le mot de passe
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
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
                  onClick={handleResetPassword}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL SESSIONS */}
      {/* ============================================ */}
      <AnimatePresence>
        {showSessionsModal && selectedUser && (
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
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 600,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                    Sessions actives
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {selectedUser.firstName} {selectedUser.lastName} • {userSessions.length} session(s)
                  </p>
                </div>
                {userSessions.length > 0 && (
                  <button
                    onClick={handleRevokeAllSessions}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 6,
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                    }}
                  >
                    Tout révoquer
                  </button>
                )}
              </div>

              {userSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Monitor size={32} color="#1e293b" />
                  <p style={{ color: '#94a3b8', marginTop: 12 }}>Aucune session active</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {userSessions.map((session, index) => (
                    <div
                      key={session.id || index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        border: '1px solid rgba(99,102,241,0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {session.deviceType === 'mobile' ? (
                          <Smartphone size={16} color="#94a3b8" />
                        ) : (
                          <Monitor size={16} color="#94a3b8" />
                        )}
                        <div>
                          <p style={{ color: '#f8fafc', fontSize: '0.85rem' }}>
                            {session.device || 'Appareil inconnu'}
                          </p>
                          <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {session.browser || 'Navigateur inconnu'} • {session.ip || 'IP inconnue'}
                          </p>
                          <p style={{ color: '#64748b', fontSize: '0.65rem' }}>
                            Connecté depuis {new Date(session.createdAt || Date.now()).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 4,
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                        }}
                      >
                        Révoquer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Historique des connexions */}
              {userLoginHistory && userLoginHistory.length > 0 && (
                <>
                  <h3 style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600, marginTop: 20, marginBottom: 12 }}>
                    Historique des connexions
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {userLoginHistory.slice(0, 5).map((log, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 6,
                          fontSize: '0.7rem',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(log.timestamp || Date.now()).toLocaleString('fr-FR')}
                        </span>
                        <span style={{ color: '#64748b' }}>{log.ip || 'IP inconnue'}</span>
                        <span style={{ color: log.success ? '#10b981' : '#ef4444' }}>
                          {log.success ? '✅ Succès' : '❌ Échec'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  onClick={() => setShowSessionsModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL STATISTIQUES UTILISATEUR */}
      {/* ============================================ */}
      <AnimatePresence>
        {showStatsModal && selectedUser && (
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
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 500,
                width: '90%',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>
                Statistiques de {selectedUser.firstName} {selectedUser.lastName}
              </h2>

              {userStats ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{
                      padding: 16,
                      background: 'rgba(99,102,241,0.1)',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a5b4fc' }}>
                        {userStats.totalQuizzes || 0}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Quiz réalisés</div>
                    </div>
                    <div style={{
                      padding: 16,
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                        {userStats.averageScore || 0}%
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Score moyen</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{
                      padding: 16,
                      background: 'rgba(245,158,11,0.1)',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                        {userStats.totalPoints || 0}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Points totaux</div>
                    </div>
                    <div style={{
                      padding: 16,
                      background: 'rgba(139,92,246,0.1)',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                        {userStats.streak || 0}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Série actuelle</div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
                      Badges
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {userAchievements && userAchievements.length > 0 ? (
                        userAchievements.map((badge, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: 12,
                              color: '#a5b4fc',
                              fontSize: '0.7rem',
                            }}
                          >
                            {badge.title || badge}
                          </span>
                        ))
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          Aucun badge pour le moment
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  Chargement des statistiques...
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => setShowStatsModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL NOTIFICATION */}
      {/* ============================================ */}
      <AnimatePresence>
        {showNotifyModal && selectedUser && (
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
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 450,
                width: '90%',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Envoyer une notification
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 20 }}>
                {notifyForm.sendToAll ? 'À tous les utilisateurs' : `À ${selectedUser.firstName} ${selectedUser.lastName}`}
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Titre
                </label>
                <input
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Message
                </label>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Type
                </label>
                <select
                  value={notifyForm.type}
                  onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="success">✅ Succès</option>
                  <option value="warning">⚠️ Avertissement</option>
                  <option value="error">❌ Erreur</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyForm.sendToAll}
                    onChange={(e) => setNotifyForm({ ...notifyForm, sendToAll: e.target.checked })}
                    style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                  />
                  <span style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Envoyer à tous les utilisateurs</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowNotifyModal(false);
                    setNotifyForm({ title: '', message: '', type: 'info', sendToAll: false });
                  }}
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
                  onClick={handleSendNotification}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL SUPPRESSION */}
      {/* ============================================ */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Supprimer l'utilisateur
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Êtes-vous sûr de vouloir supprimer <strong style={{ color: '#f8fafc' }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </strong> ?
                <br />
                <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                  Cette action est irréversible.
                </span>
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    padding: '10px 24px',
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
                  onClick={handleDeleteUser}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL IMPORT */}
      {/* ============================================ */}
      <AnimatePresence>
        {showImportModal && (
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
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
              }}
            >
              <Upload size={48} color="#10b981" style={{ marginBottom: 16 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>
                Importer des utilisateurs
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Sélectionnez un fichier JSON contenant les données utilisateurs
              </p>

              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImportUsers(e.target.files[0]);
                  }
                }}
                style={{
                  marginBottom: 20,
                  color: '#f8fafc',
                }}
              />

              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
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

export default AdminUsers;