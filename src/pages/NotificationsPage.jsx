// src/pages/NotificationsPage.jsx — VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, CheckCircle, Award, MessageCircle,
  Calendar, Star, Trophy, ArrowLeft, Settings,
  CheckCheck, X, Loader, RefreshCw
} from 'lucide-react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  getNotificationSettings
} from '../services/api';
import toast from 'react-hot-toast';
import NavHome from '../components/NavHome';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      console.log('📊 Réponse notifications:', response);
      
      // ✅ Gestion robuste de la réponse
      let notificationsList = [];
      
      if (response?.notifications && Array.isArray(response.notifications)) {
        notificationsList = response.notifications;
      } else if (response?.data && Array.isArray(response.data)) {
        notificationsList = response.data;
      } else if (Array.isArray(response)) {
        notificationsList = response;
      }
      
      // ✅ Normaliser les notifications
      notificationsList = notificationsList.map(notif => ({
        id: notif._id || notif.id,
        title: notif.title || 'Notification',
        message: notif.message || '',
        type: notif.type || 'info',
        read: notif.read || false,
        createdAt: notif.createdAt || notif.created_at || new Date(),
        data: notif.data || {}
      }));
      
      setNotifications(notificationsList);
      
      // ✅ Compter les non-lues
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      console.log(`📬 ${notificationsList.length} notifications, ${unread} non lues`);
      
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      toast.error('Impossible de charger les notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await getNotificationSettings();
      console.log('📩 Paramètres reçus:', response);
      
      const settingsData = response?.settings || response?.data || response || {};
      setSettings(settingsData);
    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
      setSettings({});
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    toast.success('Notifications actualisées');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marquée comme lue');
    } catch (error) {
      console.error('❌ Erreur marquage lecture:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info('Aucune notification non lue');
      return;
    }
    
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur marquage tout:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      achievement: <Trophy size={18} />,
      quiz: <CheckCircle size={18} />,
      comment: <MessageCircle size={18} />,
      reminder: <Calendar size={18} />,
      challenge: <Award size={18} />,
      new_quiz: <Star size={18} />,
      success: <CheckCircle size={18} />,
      warning: <Bell size={18} />,
      error: <X size={18} />,
      info: <Bell size={18} />,
      default: <Bell size={18} />
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      achievement: '#f59e0b',
      quiz: '#10b981',
      comment: '#6366f1',
      reminder: '#8b5cf6',
      challenge: '#ec4899',
      new_quiz: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#6366f1',
      default: '#64748b'
    };
    return colors[type] || colors.default;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date inconnue';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

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
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des notifications...</p>
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              padding: 12,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              marginBottom: 8,
            }}>
              <Bell size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                NOTIFICATIONS
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Notifications
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: '#94a3b8',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>

            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 8,
                  color: '#a5b4fc',
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={16} />
                Tout marquer comme lu
              </motion.button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}>
          {['all', 'unread'].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              style={{
                padding: '8px 16px',
                background: filter === option ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filter === option ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 8,
                color: filter === option ? '#a5b4fc' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: filter === option ? 600 : 400,
              }}
            >
              {option === 'all' ? 'Toutes' : 'Non lues'} 
              {option === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Liste des notifications */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          overflow: 'hidden',
        }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Bell size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Aucune notification</p>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 8 }}>
                {filter === 'unread' 
                  ? 'Vous avez lu toutes vos notifications ! 🎉' 
                  : 'Vous n\'avez pas encore de notifications'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => {
              const icon = getNotificationIcon(notification.type);
              const color = getNotificationColor(notification.type);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: index < filteredNotifications.length - 1 ? '1px solid rgba(99,102,241,0.1)' : 'none',
                    background: notification.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                    cursor: notification.read ? 'default' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  onMouseEnter={(e) => {
                    if (!notification.read) {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read 
                      ? 'transparent' 
                      : 'rgba(99,102,241,0.05)';
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    marginRight: 14,
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 4,
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{ 
                        color: '#f8fafc', 
                        fontWeight: notification.read ? 400 : 600, 
                        fontSize: '0.9rem' 
                      }}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#6366f1',
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                    
                    <p style={{ 
                      color: '#94a3b8', 
                      fontSize: '0.85rem', 
                      marginBottom: 4,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {notification.message}
                    </p>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      fontSize: '0.7rem',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ color: '#64748b' }}>
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.type && notification.type !== 'default' && (
                        <span style={{
                          padding: '2px 8px',
                          background: `${color}15`,
                          borderRadius: 4,
                          color: color,
                          textTransform: 'capitalize',
                          fontSize: '0.65rem',
                        }}>
                          {notification.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 6,
                      opacity: 0.4,
                      transition: 'all 0.2s',
                      marginLeft: 8,
                      flexShrink: 0,
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.4;
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }}
                    title="Supprimer"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Bouton pour charger plus */}
        {filteredNotifications.length > 0 && filteredNotifications.length >= 20 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={fetchNotifications}
              style={{
                padding: '8px 24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Charger plus
            </button>
          </div>
        )}

        {/* Paramètres de notification */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Settings size={18} color="#64748b" />
            <div>
              <h3 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', marginBottom: 1 }}>
                Paramètres de notification
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {settings?.email ? '📧 Notifications email activées' : 'Gérez vos préférences'}
                {settings?.push ? ' • 📱 Push activé' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '6px 16px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8,
              color: '#a5b4fc',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            }}
          >
            Configurer
          </button>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;