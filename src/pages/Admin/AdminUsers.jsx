// src/pages/Admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, MoreVertical, Edit2, Trash2,
  UserPlus, Mail, Calendar, Shield, Award, Star,
  ChevronLeft, ChevronRight, Download, Upload, RefreshCw, // ✅ RefreshCw est déjà là
  CheckCircle, XCircle, AlertTriangle, Eye, Lock, Unlock,
  Crown, UserCog, UserX, UserCheck, Settings, BarChart,
  Phone, MapPin, Globe, Briefcase, Link as LinkIcon
} from 'lucide-react';
import {
  getUsers,
  deleteUser,
  updateUser,
  getUserStats,
  getUserAchievements,
  sendNotification,
  exportUserData,
  importData
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const AdminUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Statistiques utilisateur sélectionné
  const [userStats, setUserStats] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);

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
    badges: []
  });

  // Formulaire de notification
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    type: 'info',
    sendToAll: false
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

const fetchUsers = async () => {
  setLoading(true);
  try {
    const response = await getUsers({
      page: currentPage,
      limit: usersPerPage,
      search: searchTerm,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    });
    
    console.log('📊 Données reçues:', response);
    
    // ✅ Gestion robuste de la réponse
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

  const handleSendNotification = async () => {
    try {
      if (notifyForm.sendToAll) {
        // Envoyer à tous les utilisateurs
        await sendNotification({
          ...notifyForm,
          broadcast: true
        });
        toast.success('Notification envoyée à tous les utilisateurs');
      } else {
        // Envoyer à l'utilisateur sélectionné
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
      setSelectedUsers(users.map(u => u.id));
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
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: <Crown size={12} /> },
      formateur: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: <Award size={12} /> },
      user: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', icon: <UserCheck size={12} /> }
    };
    return colors[role] || colors.user;
  };

  const getStatusBadge = (user) => {
    if (user.emailVerified) {
      return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', text: 'Vérifié' };
    }
    return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', text: 'En attente' };
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Gestion des Utilisateurs
            </h1>
            <p style={{ color: '#94a3b8' }}>
              {totalUsers} utilisateurs au total
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
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
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
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
                padding: '12px 12px 12px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="formateur">Formateurs</option>
            <option value="user">Utilisateurs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="verified">Vérifiés</option>
            <option value="pending">En attente</option>
          </select>

          {selectedUsers.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => handleBulkAction('delete')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
              Supprimer ({selectedUsers.length})
            </motion.button>
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                <th style={{ padding: '16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                  />
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Utilisateur</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Rôle</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Niveau</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Statut</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Inscription</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Dernière activité</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
                    <RefreshCw size={32} className="animate-spin" color="#6366f1" />
                    <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des utilisateurs...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
                    <Users size={48} color="#1e293b" />
                    <p style={{ color: '#94a3b8', marginTop: 16 }}>Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const statusBadge = getStatusBadge(user);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        borderBottom: '1px solid rgba(99,102,241,0.1)',
                        cursor: 'pointer',
                      }}
                      whileHover={{ background: 'rgba(99,102,241,0.05)' }}
                    >
                      <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleToggleSelect(user.id)}
                          style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                        />
                      </td>
                      <td style={{ padding: '16px' }} onClick={() => handleViewUser(user)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.firstName}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                            }}>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                          )}
                          <div>
                            <p style={{ color: '#f8fafc', fontWeight: 600 }}>
                              {user.firstName} {user.lastName}
                            </p>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: roleBadge.bg,
                          border: `1px solid ${roleBadge.color}30`,
                          borderRadius: 12,
                          color: roleBadge.color,
                          fontSize: '0.7rem',
                        }}>
                          {roleBadge.icon}
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#f8fafc' }}>{user.niveau}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: statusBadge.bg,
                          border: `1px solid ${statusBadge.color}30`,
                          borderRadius: 12,
                          color: statusBadge.color,
                          fontSize: '0.7rem',
                        }}>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString('fr-FR') : 'Jamais'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.3)',
                              borderRadius: 6,
                              color: '#a5b4fc',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setShowNotifyModal(true);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              borderRadius: 6,
                              color: '#10b981',
                              cursor: 'pointer',
                            }}
                          >
                            <Mail size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 6,
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
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
            <span style={{ color: '#94a3b8' }}>
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

      {/* MODAL ÉDITION UTILISATEUR */}
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Modifier l'utilisateur
              </h2>

              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Prénom
                    </label>
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
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
                      Nom
                    </label>
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
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

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Rôle
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
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
                      Niveau
                    </label>
                    <select
                      value={editForm.niveau}
                      onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
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
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Avatar URL
                  </label>
                  <input
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
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
                    Téléphone
                  </label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Pays
                    </label>
                    <input
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
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
                      Ville
                    </label>
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
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

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Profession
                  </label>
                  <input
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
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
                    Site web
                  </label>
                  <input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
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
                    Email vérifié
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.emailVerified}
                      onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Oui</span>
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
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL STATISTIQUES UTILISATEUR */}
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Statistiques de {selectedUser.firstName} {selectedUser.lastName}
              </h2>

              {userStats && (
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
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Quiz réalisés</div>
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
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Score moyen</div>
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
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Points totaux</div>
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
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Série actuelle</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
                      Accomplissements
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {userAchievements && userAchievements.length > 0 ? (
                        userAchievements.map((badge, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.3)',
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

      {/* MODAL NOTIFICATION */}
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Envoyer une notification
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                  Titre
                </label>
                <input
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
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
                    padding: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
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
                    padding: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                  }}
                >
                  <option value="info">Information</option>
                  <option value="success">Succès</option>
                  <option value="warning">Avertissement</option>
                  <option value="error">Erreur</option>
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
                  <span style={{ color: '#f8fafc' }}>Envoyer à tous les utilisateurs</span>
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
                  }}
                >
                  Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SUPPRESSION */}
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Supprimer l'utilisateur
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Êtes-vous sûr de vouloir supprimer {selectedUser.firstName} {selectedUser.lastName} ?
                Cette action est irréversible.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
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
                  onClick={handleDeleteUser}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL IMPORT */}
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
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
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