// src/pages/LeaderboardPage.jsx - Version optimisée avec cache et debounce
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Award, Crown, Users, 
  TrendingUp, ArrowLeft, Search, Filter 
} from 'lucide-react';
import { getLeaderboard } from '../services/api';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
// ✅ Cache pour éviter les requêtes inutiles
const CACHE_KEY = 'leaderboard_cache';
const CACHE_DURATION = 60 * 1000; // 1 minute

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalUsers: 0
  });
  
  // ✅ Ref pour éviter les appels multiples
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    // ✅ Charger depuis le cache au démarrage
    loadFromCache();
    fetchLeaderboard();
  }, []);

  // ✅ Charger depuis le cache
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setLeaders(data.users || []);
          setUserRank(data.userRank);
          setUserPoints(data.userPoints);
          setPagination({
            page: data.page || 1,
            totalPages: data.totalPages || 1,
            totalUsers: data.totalUsers || 0
          });
          return true;
        }
      }
    } catch (e) {
      console.warn('Cache invalide');
    }
    return false;
  };

  // ✅ Sauvegarder dans le cache
  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Impossible de sauvegarder le cache');
    }
  };

  // ✅ Fonction fetch avec debounce et rate limiting
  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    // ✅ Éviter les appels multiples
    if (isFetching.current) return;
    
    // ✅ Rate limiting : au moins 1 seconde entre les appels
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime.current < 1000)) {
      console.log('⏳ Attente du rate limit...');
      return;
    }

    // ✅ Vérifier le cache si ce n'est pas un refresh forcé
    if (!forceRefresh) {
      const cached = loadFromCache();
      if (cached) {
        setLoading(false);
        return;
      }
    }

    isFetching.current = true;
    setLoading(true);
    lastFetchTime.current = now;

    try {
      const params = { 
        timeframe, 
        category, 
        search: searchTerm,
        page: pagination.page,
        limit: 8
      };
      
      console.log('📥 Fetch leaderboard:', params);
      
      const data = await getLeaderboard(params);
      
      setLeaders(data.users || []);
      setUserRank(data.userRank);
      setUserPoints(data.userPoints);
      setPagination({
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        totalUsers: data.totalUsers || 0
      });
      
      // ✅ Sauvegarder dans le cache
      saveToCache(data);
      
    } catch (error) {
      console.error('Erreur chargement classement:', error);
      if (error?.response?.status === 429) {
        toast.error('Trop de requêtes, veuillez patienter');
        // ✅ Utiliser le cache en cas d'erreur 429
        loadFromCache();
      } else {
        toast.error('Impossible de charger le classement');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [timeframe, category, searchTerm, pagination.page]);

  // ✅ Debounce pour la recherche
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // ✅ Debounce de 500ms pour éviter les appels trop fréquents
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchLeaderboard(true);
    }, 500);
  };

  // ✅ Changement de timeframe avec refresh forcé
  const handleTimeframeChange = (period) => {
    setTimeframe(period);
    setPagination(prev => ({ ...prev, page: 1 }));
    // ✅ Petit délai pour éviter les appels simultanés
    setTimeout(() => fetchLeaderboard(true), 100);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchLeaderboard(true), 100);
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      setTimeout(() => fetchLeaderboard(true), 100);
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      setTimeout(() => fetchLeaderboard(true), 100);
    }
  };

  // ✅ Réinitialiser le cache quand les filtres changent
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ... (le reste du code de rendu reste identique)
  
  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return { symbol: '▲', color: '#10b981', text: '+2' };
      case 'down': return { symbol: '▼', color: '#ef4444', text: '-1' };
      default: return { symbol: '●', color: '#94a3b8', text: '0' };
    }
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#f59e0b';
      case 2: return '#94a3b8';
      case 3: return '#cd7f32';
      default: return '#64748b';
    }
  };

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
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(99,102,241,0.1)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#94a3b8' }}>Chargement du classement...</p>
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

      {/* Glow effect */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
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

          <div>
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
              <Crown size={14} color="#f59e0b" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                CLASSEMENT
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Classement communautaire
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {pagination.totalUsers} participants • Page {pagination.page}/{pagination.totalPages}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['weekly', 'monthly', 'alltime'].map((period) => (
              <button
                key={period}
                onClick={() => handleTimeframeChange(period)}
                style={{
                  padding: '8px 16px',
                  background: timeframe === period ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${timeframe === period ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 8,
                  color: timeframe === period ? '#a5b4fc' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {period === 'weekly' ? 'Cette semaine' : period === 'monthly' ? 'Ce mois' : 'Tout temps'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Rechercher..."
                style={{
                  padding: '8px 8px 8px 32px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '0.8rem',
                }}
              />
            </div>
            <select
              value={category}
              onChange={handleCategoryChange}
              style={{
                padding: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: '#f8fafc',
                outline: 'none',
                fontSize: '0.8rem',
              }}
            >
              <option value="all">Toutes catégories</option>
              <option value="maths">Mathématiques</option>
              <option value="sciences">Sciences</option>
              <option value="francais">Français</option>
            </select>
          </div>
        </div>

        {/* Podium */}
        {leaders.length >= 3 && pagination.page === 1 && !searchTerm && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 20,
            marginBottom: 40,
          }}>
            {/* 2ème place */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
                width: 150,
              }}
            >
              <Medal size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #64748b, #475569)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 600,
              }}>
                {leaders[1]?.avatar || '?'}
              </div>
              <h3 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                {leaders[1]?.name || 'Anonyme'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{leaders[1]?.points || 0} pts</p>
            </motion.div>

            {/* 1ère place */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #f59e0b',
                borderRadius: 20,
                padding: 24,
                textAlign: 'center',
                width: 180,
                position: 'relative',
                transform: 'scale(1.1)',
              }}
            >
              <Crown size={32} color="#f59e0b" style={{ marginBottom: 8 }} />
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}>
                {leaders[0]?.avatar || '?'}
              </div>
              <h3 style={{ color: '#f8fafc', fontWeight: 600 }}>{leaders[0]?.name || 'Anonyme'}</h3>
              <p style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{leaders[0]?.points || 0} pts</p>
            </motion.div>

            {/* 3ème place */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
                width: 150,
              }}
            >
              <Medal size={32} color="#cd7f32" style={{ marginBottom: 8 }} />
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #b45309, #92400e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 600,
              }}>
                {leaders[2]?.avatar || '?'}
              </div>
              <h3 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                {leaders[2]?.name || 'Anonyme'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{leaders[2]?.points || 0} pts</p>
            </motion.div>
          </div>
        )}

        {/* Liste des classements - garder le code existant */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          overflow: 'hidden',
        }}>
          {leaders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Users size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p style={{ color: '#94a3b8' }}>Aucun classement disponible</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>
                Commencez à faire des quiz pour apparaître dans le classement !
              </p>
            </div>
          ) : (
            leaders.map((leader, index) => {
              const trend = getTrendIcon(leader.trend);
              return (
                <motion.div
                  key={leader.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: index < leaders.length - 1 ? '1px solid rgba(99,102,241,0.1)' : 'none',
                    background: leader.rank === userRank ? 'rgba(99,102,241,0.1)' : 'transparent',
                  }}
                >
                  <span style={{
                    width: 40,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: getRankColor(leader.rank),
                  }}>
                    #{leader.rank}
                  </span>
                  
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
                    marginRight: 12,
                  }}>
                    {leader.avatar || '?'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 2 }}>
                      {leader.name || 'Anonyme'}
                    </h4>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>{leader.quizzes || 0} quiz</span>
                      <span>{leader.accuracy || 0}% précision</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#a5b4fc', fontWeight: 700 }}>{leader.points || 0} pts</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 2,
                      color: trend.color,
                      fontSize: '0.7rem',
                    }}>
                      <span>{trend.symbol}</span>
                      <span>{trend.text}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}>
            <button
              onClick={handlePrevPage}
              disabled={pagination.page === 1}
              style={{
                padding: '8px 16px',
                background: pagination.page === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.1)',
                border: `1px solid ${pagination.page === 1 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: 8,
                color: pagination.page === 1 ? '#64748b' : '#a5b4fc',
                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Précédent
            </button>
            <span style={{ color: '#94a3b8' }}>
              Page {pagination.page} sur {pagination.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.page === pagination.totalPages}
              style={{
                padding: '8px 16px',
                background: pagination.page === pagination.totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.1)',
                border: `1px solid ${pagination.page === pagination.totalPages ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: 8,
                color: pagination.page === pagination.totalPages ? '#64748b' : '#a5b4fc',
                cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Suivant
            </button>
          </div>
        )}

        {/* Position de l'utilisateur */}
        {userRank && currentUser && (
          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid #6366f1',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
              }}>
                {currentUser.avatar || currentUser.nom?.[0] || currentUser.name?.[0] || 'U'}
              </div>
              <div>
                <h4 style={{ color: '#f8fafc', fontWeight: 600 }}>{currentUser.nom || currentUser.name || 'Vous'}</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Continuez pour monter dans le classement !</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#a5b4fc', fontWeight: 700 }}>#{userRank}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{userPoints} pts</div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage;