// src/pages/Compose.jsx - Version avec domainConfig
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Eye,
  BookOpen,
  Layers,
  Zap
} from "lucide-react";
import axios from "axios";
import DOMAIN_DATA, { 
  getAllDomaines, 
  getAllSousDomaines, 
  getAllLevels, 
  getAllMatieres 
} from '../data/domainConfig';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const Compose = () => {
  const navigate = useNavigate();
  
  // État du formulaire
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSousDomaine, setSelectedSousDomaine] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  // Options
  const domains = getAllDomaines();
  const sousDomaines = selectedDomain ? getAllSousDomaines(selectedDomain) : [];
  const levels = selectedSousDomaine ? getAllLevels(selectedDomain, selectedSousDomaine) : [];
  const matieres = selectedSousDomaine ? getAllMatieres(selectedDomain, selectedSousDomaine) : [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || 
        droppedFile.name.endsWith('.docx') || 
        droppedFile.name.endsWith('.doc'))) {
      setFile(droppedFile);
      setError(null);
    } else {
      toast.error("Veuillez déposer un fichier PDF ou Word");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }

    if (!selectedDomain || !selectedSousDomaine || !selectedLevel || !selectedMatiere) {
      toast.error("Veuillez sélectionner tous les critères pédagogiques");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);
    formData.append("domainId", selectedDomain);
    formData.append("sousDomaineId", selectedSousDomaine);
    formData.append("levelId", selectedLevel);
    formData.append("matiereId", selectedMatiere);

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/compose`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      setQuestions(response.data.questions || []);
      setPreview(response.data.documentText || "");
      toast.success(`${response.data.questions?.length || 0} questions générées !`);
    } catch (error) {
      console.error("Erreur lors de la génération :", error);
      setError(error.response?.data?.error || "Erreur lors de la génération des questions.");
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <NavHome />
      <div style={styles.backgroundGrid} />
      <div style={styles.glowEffect} />

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/quizzes')}
            style={styles.backButton}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <div style={styles.badge}>
              <Sparkles size={14} color="#6366f1" />
              <span>GÉNÉRATION PAR DOCUMENT</span>
            </div>
            <h1 style={styles.title}>Générateur d'épreuves</h1>
            <p style={styles.subtitle}>Importez un fichier PDF ou Word pour générer automatiquement des questions</p>
          </div>
        </div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.card}
        >
          {/* Critères pédagogiques */}
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>
                <BookOpen size={14} style={{ marginRight: 4 }} />
                Domaine *
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setSelectedSousDomaine('');
                  setSelectedLevel('');
                  setSelectedMatiere('');
                }}
                style={styles.select}
              >
                <option value="">Sélectionner...</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                <Layers size={14} style={{ marginRight: 4 }} />
                Sous-domaine *
              </label>
              <select
                value={selectedSousDomaine}
                onChange={(e) => {
                  setSelectedSousDomaine(e.target.value);
                  setSelectedLevel('');
                  setSelectedMatiere('');
                }}
                disabled={!selectedDomain}
                style={{...styles.select, opacity: !selectedDomain ? 0.5 : 1}}
              >
                <option value="">Sélectionner...</option>
                {sousDomaines.map(sd => (
                  <option key={sd.id} value={sd.id}>{sd.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                <Zap size={14} style={{ marginRight: 4 }} />
                Niveau *
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={!selectedSousDomaine}
                style={{...styles.select, opacity: !selectedSousDomaine ? 0.5 : 1}}
              >
                <option value="">Sélectionner...</option>
                {levels.map(l => (
                  <option key={l.id} value={l.id}>{l.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                <BookOpen size={14} style={{ marginRight: 4 }} />
                Matière *
              </label>
              <select
                value={selectedMatiere}
                onChange={(e) => setSelectedMatiere(e.target.value)}
                disabled={!selectedSousDomaine}
                style={{...styles.select, opacity: !selectedSousDomaine ? 0.5 : 1}}
              >
                <option value="">Sélectionner...</option>
                {matieres.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Zone de dépôt */}
          <div
            style={{
              ...styles.dropZone,
              borderColor: dragActive ? '#6366f1' : 'rgba(99,102,241,0.3)',
              background: dragActive ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <div style={styles.dropIcon}>
              <Upload size={40} color={dragActive ? '#6366f1' : '#a5b4fc'} />
            </div>

            {file ? (
              <>
                <div style={styles.fileSelected}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: 500 }}>Fichier sélectionné</span>
                </div>
                <p style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: 4 }}>
                  {file.name}
                </p>
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: 8 }}>
                  Cliquez ou glissez-déposez votre fichier
                </p>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  PDF, DOCX, DOC acceptés (max 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {/* Bouton générer */}
          {file && selectedMatiere && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              style={styles.generateButton}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Générer les questions
                </>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Aperçu */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.previewCard}
          >
            <div style={styles.previewHeader}>
              <Eye size={18} color="#6366f1" />
              <h2 style={styles.previewTitle}>Aperçu du texte extrait</h2>
            </div>
            <div style={styles.previewContent}>
              {preview}
            </div>
          </motion.div>
        )}

        {/* Questions générées */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.questionsCard}
          >
            <div style={styles.questionsHeader}>
              <FileText size={18} color="#10b981" />
              <h2 style={styles.questionsTitle}>
                Questions générées ({questions.length})
              </h2>
            </div>

            <div style={styles.questionsList}>
              {questions.map((q, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={styles.questionItem}
                >
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNumber}>{index + 1}</span>
                    <p style={styles.questionText}>{q.question}</p>
                  </div>

                  <div style={styles.optionsGrid}>
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        style={styles.option}
                      >
                        <span style={styles.optionLetter}>
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span style={styles.optionText}>{opt}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
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

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
    position: 'relative',
    padding: '24px',
  },
  backgroundGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glowEffect: {
    position: 'fixed',
    top: '-15%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '70vw',
    height: '50vh',
    background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  main: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 12,
    padding: 12,
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 20,
    marginBottom: 8,
    color: '#a5b4fc',
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    color: '#64748b',
    margin: 0,
  },
  card: {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10,
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.875rem',
  },
  dropZone: {
    border: '2px dashed',
    borderRadius: 16,
    padding: 40,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: 16,
  },
  dropIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(99,102,241,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  fileSelected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid #10b981',
    borderRadius: 20,
    marginBottom: 12,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    marginBottom: 16,
  },
  generateButton: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
  },
  previewCard: {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#f8fafc',
    margin: 0,
  },
  previewContent: {
    maxHeight: 200,
    overflowY: 'auto',
    padding: 16,
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    color: '#94a3b8',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  questionsCard: {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 24,
    padding: 24,
  },
  questionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  questionsTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#f8fafc',
    margin: 0,
  },
  questionsList: {
    maxHeight: 500,
    overflowY: 'auto',
    paddingRight: 8,
  },
  questionItem: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(99,102,241,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#6366f1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  questionText: {
    color: '#f8fafc',
    fontWeight: 500,
    flex: 1,
    margin: 0,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  option: {
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  optionLetter: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#64748b',
    minWidth: 20,
  },
  optionText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};

export default Compose;