// src/pages/ExamScreen.jsx - Ajout du bouton retour
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Clock, Calendar, Eye, ChevronRight,
  Search, Filter, Award, BarChart, Users, Loader,
  ArrowLeft  // ✅ AJOUT DE L'ICÔNE
} from 'lucide-react';
import { getExams } from '../services/api';
import toast from 'react-hot-toast';

const ExamScreen = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchExams();
  }, [selectedFilter]);

  const fetchExams = async () => {
  setLoading(true);
  try {
    const data = await getExams({ 
      filter: selectedFilter,
      limit: 50 
    });
    
    console.log('📦 Données reçues (ExamScreen):', data);
    
    let examsArray = [];
    
    if (Array.isArray(data)) {
      examsArray = data;
    } else if (data?.data && Array.isArray(data.data)) {
      examsArray = data.data;
    } else {
      examsArray = [];
    }
    
    setExams(examsArray);
  } catch (error) {
    console.error('❌ Erreur chargement examens:', error);
    toast.error('Impossible de charger les examens');
    setExams([]);
  } finally {
    setLoading(false);
  }
};

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getDomainColor = (domain) => {
    const colors = {
      'Mathématiques': '#6366f1',
      'Sciences': '#10b981',
      'Français': '#f59e0b',
      'Histoire': '#ef4444',
      'Géographie': '#8b5cf6',
    };
    return colors[domain] || '#64748b';
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
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des examens...</p>
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* ✅ BOUTON RETOUR AJOUTÉ ICI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/exams')}
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
            <ArrowLeft size={20} />
            <span>Retour aux examens</span>
          </motion.button>
        </div>

        {/* En-tête (inchangé) */}
        <div style={{ marginBottom: 32 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <BookOpen size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                BIBLIOTHÈQUE D'EXAMENS
              </span>
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 8,
            }}>
              Examens disponibles
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              {exams.length} examen{exams.length > 1 ? 's' : ''} disponibles
            </p>
          </motion.div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
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
              placeholder="Rechercher un examen..."
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
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            style={{
              padding: '12px 32px 12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tous les examens</option>
            <option value="recent">Récents</option>
            <option value="popular">Populaires</option>
          </select>
        </div>

        {/* Grille des examens (inchangée) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {filteredExams.map((exam, index) => {
            const color = getDomainColor(exam.domain);
            const examId = exam._id || exam.id;
            
            return (
              <motion.div
                key={examId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/exam/${examId}`)}
                style={{
                  background: 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {/* Image d'en-tête */}
                <div style={{
                  height: 140,
                  background: `linear-gradient(135deg, ${color}80, #0f172a)`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 16,
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '4px 12px',
                    background: `${color}20`,
                    border: `1px solid ${color}`,
                    borderRadius: 20,
                    color: color,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    {exam.domain || 'Général'}
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#f8fafc',
                    marginBottom: 8,
                  }}>
                    {exam.title || 'Sans titre'}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}>
                    {exam.level && (
                      <span style={{
                        padding: '4px 8px',
                        background: 'rgba(99,102,241,0.1)',
                        borderRadius: 8,
                        color: '#a5b4fc',
                        fontSize: '0.8rem',
                      }}>
                        {exam.level}
                      </span>
                    )}
                  </div>

                  {/* Statistiques */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 16,
                    padding: 12,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 12,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <Clock size={14} color="#64748b" style={{ marginBottom: 4 }} />
                      <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>
                        {exam.duration || 0} min
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <BookOpen size={14} color="#64748b" style={{ marginBottom: 4 }} />
                      <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>
                        {exam.questions?.length || 0} questions
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Users size={14} color="#64748b" style={{ marginBottom: 4 }} />
                      <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>
                        {exam.attempts || 0}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Award size={14} color="#64748b" style={{ marginBottom: 4 }} />
                      <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>
                        {exam.avgScore || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Pied de carte */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(99,102,241,0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} color="#64748b" />
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'Date inconnue'}
                      </span>
                    </div>
                    <ChevronRight size={18} color={color} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Message si aucun résultat */}
        {filteredExams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'rgba(15,23,42,0.5)',
              border: '1px dashed rgba(99,102,241,0.3)',
              borderRadius: 24,
            }}
          >
            <BookOpen size={48} color="#1e293b" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: 8 }}>
              Aucun examen trouvé
            </h3>
            <p style={{ color: '#64748b' }}>
              {searchTerm ? 'Essayez d\'autres termes de recherche' : 'Aucun examen disponible pour le moment'}
            </p>
          </motion.div>
        )}
      </main>

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

export default ExamScreen;