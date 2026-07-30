// src/components/ExamCard.jsx - Version améliorée et complète
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, Clock, Layers, BookOpen, FileText, 
  CheckCircle, Edit, Trash2, AlertCircle,
  Calendar, User, Award, Eye
} from 'lucide-react';

const ExamCard = ({ exam, onStart, onDelete, onEdit, isAdmin = false }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // ✅ Normalisation des données pour gérer les différents formats
  const examId = exam._id || exam.id;
  const examTitle = exam.title || exam.metadata?.subject || 'Sans titre';
  const examDescription = exam.description || exam.metadata?.description || '';
  const examDomain = exam.domain || exam.metadata?.domaine || 'Général';
  const examLevel = exam.level || exam.metadata?.level || 'Non spécifié';
  const examSubject = exam.subject || exam.matiereNom || exam.metadata?.subject || 'Non spécifié';
  const examDuration = exam.duration || exam.metadata?.duration || 0;
  const examQuestionsCount = exam.questions?.length || exam.questionCount || 0;
  const examTotalPoints = exam.totalPoints || exam.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0;
  const examStatus = exam.status || 'draft';
  const examCreatedAt = exam.createdAt || exam.metadata?.createdAt;
  const examCreatedBy = exam.createdBy?.firstName || exam.createdBy?.name || 'Utilisateur';
  
  // ✅ Configuration des couleurs selon le domaine
  const domainColors = {
    'Éducatif': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    'Professionnel': { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'Spiritualité et Culture Camerounaise': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    '1': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    '2': { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    '3': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  };

  const domainStyle = domainColors[examDomain] || { 
    bg: 'rgba(148,163,184,0.15)', 
    color: '#94a3b8', 
    border: 'rgba(148,163,184,0.3)' 
  };

  // ✅ Configuration du statut
  const statusConfig = {
    draft: { 
      label: 'Brouillon', 
      icon: <Edit size={14} />, 
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      border: 'rgba(245,158,11,0.3)'
    },
    published: { 
      label: 'Publié', 
      icon: <CheckCircle size={14} />, 
      color: '#10b981',
      bg: 'rgba(16,185,129,0.15)',
      border: 'rgba(16,185,129,0.3)'
    },
    archived: { 
      label: 'Archivé', 
      icon: <FileText size={14} />, 
      color: '#64748b',
      bg: 'rgba(100,116,139,0.15)',
      border: 'rgba(100,116,139,0.3)'
    }
  };

  const statusInfo = statusConfig[examStatus] || statusConfig.draft;

  // ✅ Formater la date
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  // ✅ Gestionnaire de clic sur "Commencer"
  const handleStart = (e) => {
    e.stopPropagation();
    if (onStart) {
      onStart(exam);
    } else {
      navigate(`/exam/${examId}`, { state: { exam } });
    }
  };

  // ✅ Gestionnaire de clic sur "Modifier"
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(exam);
    } else {
      navigate(`/exam/edit/${examId}`, { state: { exam } });
    }
  };

  // ✅ Gestionnaire de clic sur "Supprimer"
  const handleDelete = (e) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      if (onDelete) {
        onDelete(examId);
      }
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // ✅ Gestionnaire d'annulation de suppression
  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isHovered ? domainStyle.color : 'rgba(99,102,241,0.15)'}`,
        borderRadius: 20,
        padding: 24,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        opacity: examStatus === 'archived' ? 0.6 : 1,
      }}
      onClick={() => navigate(`/exam/${examId}`, { state: { exam } })}
    >
      {/* ✅ Barre d'accentuation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${domainStyle.color}, ${statusInfo.color})`,
        transition: 'all 0.3s',
      }} />

      {/* ✅ En-tête avec titre et statut */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#f8fafc',
          flex: 1,
          lineHeight: 1.4,
        }}>
          {examTitle}
        </h3>
        
        {/* Badge de statut */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          background: statusInfo.bg,
          border: `1px solid ${statusInfo.border}`,
          borderRadius: 12,
          color: statusInfo.color,
          fontSize: '0.7rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>
      </div>

      {/* ✅ Description */}
      {examDescription && (
        <p style={{
          color: '#94a3b8',
          fontSize: '0.9rem',
          marginBottom: 16,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {examDescription}
        </p>
      )}

      {/* ✅ Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span style={{
          padding: '4px 10px',
          background: domainStyle.bg,
          border: `1px solid ${domainStyle.border}`,
          borderRadius: 12,
          color: domainStyle.color,
          fontSize: '0.75rem',
        }}>
          📚 {examDomain}
        </span>
        <span style={{
          padding: '4px 10px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: 12,
          color: '#a5b4fc',
          fontSize: '0.75rem',
        }}>
          🎯 {examLevel}
        </span>
        <span style={{
          padding: '4px 10px',
          background: 'rgba(16,185,129,0.1)',
          borderRadius: 12,
          color: '#34d399',
          fontSize: '0.75rem',
        }}>
          📖 {examSubject}
        </span>
        {examTotalPoints > 0 && (
          <span style={{
            padding: '4px 10px',
            background: 'rgba(245,158,11,0.1)',
            borderRadius: 12,
            color: '#fbbf24',
            fontSize: '0.75rem',
          }}>
            ⭐ {examTotalPoints} pts
          </span>
        )}
      </div>

      {/* ✅ Statistiques */}
      <div style={{
        display: 'flex',
        gap: 16,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} color="#64748b" />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            {examDuration} min
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={14} color="#64748b" />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            {examQuestionsCount} questions
          </span>
        </div>
        {examCreatedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              {formatDate(examCreatedAt)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={14} color="#64748b" />
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
            {examCreatedBy}
          </span>
        </div>
      </div>

      {/* ✅ Boutons d'action */}
      <div style={{ 
        display: 'flex', 
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {/* Bouton principal : Commencer */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            minWidth: '120px',
          }}
        >
          <Play size={16} />
          Commencer l'épreuve
        </motion.button>

        {/* Boutons secondaires */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Bouton Modifier (admin ou propriétaire) */}
          {(isAdmin || exam.createdBy?.id === localStorage.getItem('userId')) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              style={{
                padding: '12px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12,
                color: '#a5b4fc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Modifier"
            >
              <Edit size={16} />
            </motion.button>
          )}

          {/* Bouton Supprimer (admin ou propriétaire) */}
          {(isAdmin || exam.createdBy?.id === localStorage.getItem('userId')) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              style={{
                padding: '12px',
                background: showDeleteConfirm ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                border: showDeleteConfirm ? '1px solid #ef4444' : '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12,
                color: showDeleteConfirm ? '#ef4444' : '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
            >
              {showDeleteConfirm ? (
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Confirmer</span>
              ) : (
                <Trash2 size={16} />
              )}
            </motion.button>
          )}

          {/* Bouton Annuler (quand confirmation de suppression) */}
          {showDeleteConfirm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelDelete}
              style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Annuler"
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Annuler</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ✅ Badge "Nouveau" pour les examens récents */}
      {examCreatedAt && (
        (new Date() - new Date(examCreatedAt)) < 24 * 60 * 60 * 1000 && (
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '2px 10px',
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 12,
            color: '#34d399',
            fontSize: '0.6rem',
            fontWeight: 600,
          }}>
            NOUVEAU
          </div>
        )
      )}

      {/* ✅ Badge "Admin" pour les admins */}
      {isAdmin && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '2px 8px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          color: '#f87171',
          fontSize: '0.5rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>
          ADMIN
        </div>
      )}
    </motion.div>
  );
};

export default ExamCard;