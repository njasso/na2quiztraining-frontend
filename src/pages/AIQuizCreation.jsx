// src/pages/AIQuizCreation.jsx — Création de quiz par IA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NavHome from '../components/NavHome';
import {
  Sparkles, ArrowLeft, Bot, Settings, BookOpen,
  Layers, Tag, Eye, Save, Download, Loader2,
  CheckCircle, XCircle, ChevronRight
} from 'lucide-react';

const AIQuizCreation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    domain: '',
    category: '',
    level: '',
    subject: '',
    questionType: 'multiple',
    numQuestions: 10,
    keywords: '',
    difficulty: 'medium',
  });
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizName, setQuizName] = useState('');

  const domains = [
    'Mathématiques',
    'Sciences',
    'Français',
    'Histoire',
    'Géographie',
    'Anglais',
    'Physique',
    'Chimie',
    'Biologie',
  ];

  const categories = {
    Mathématiques: ['Algèbre', 'Géométrie', 'Analyse', 'Probabilités'],
    Sciences: ['Physique', 'Chimie', 'Biologie', 'SVT'],
    Français: ['Grammaire', 'Conjugaison', 'Orthographe', 'Littérature'],
    Histoire: ['Antiquité', 'Moyen Âge', 'Moderne', 'Contemporaine'],
    // ... autres catégories
  };

  const levels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
  const subjects = ['Cours 1', 'Cours 2', 'Cours 3']; // À adapter

  const handleGenerate = () => {
    if (!quizConfig.domain || !quizConfig.category || !quizConfig.level || !quizConfig.subject) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    // Simulation de génération IA
    setTimeout(() => {
      const mockQuiz = Array.from({ length: quizConfig.numQuestions }, (_, i) => ({
        id: i + 1,
        question: `Question ${i + 1} sur ${quizConfig.subject}`,
        options: [
          `Option A pour la question ${i + 1}`,
          `Option B pour la question ${i + 1}`,
          `Option C pour la question ${i + 1}`,
          `Option D pour la question ${i + 1}`,
        ],
        correctAnswer: `Option A pour la question ${i + 1}`,
        explanation: `Explication détaillée pour la question ${i + 1}`,
        difficulty: quizConfig.difficulty,
      }));

      setGeneratedQuiz(mockQuiz);
      setQuizName(`${quizConfig.subject} - Quiz IA ${new Date().toLocaleDateString()}`);
      setCurrentStep(2);
      setLoading(false);
    }, 2000);
  };

  const handleSave = () => {
    if (!generatedQuiz || !quizName) {
      alert('Veuillez générer un quiz et lui donner un nom');
      return;
    }

    const savedQuizzes = JSON.parse(localStorage.getItem('ai_quizzes') || '[]');
    localStorage.setItem('ai_quizzes', JSON.stringify([
      ...savedQuizzes,
      {
        id: Date.now(),
        name: quizName,
        config: quizConfig,
        questions: generatedQuiz,
        createdAt: new Date().toISOString(),
      }
    ]));

    alert('Quiz enregistré avec succès !');
    navigate('/exams');
  };

  const ConfigStep = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 24,
        padding: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Settings size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f8fafc' }}>
              Configuration du quiz
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Paramétrez les critères de génération
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 20 }}>
          {/* Domaine */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
              Domaine *
            </label>
            <select
              value={quizConfig.domain}
              onChange={(e) => setQuizConfig({ ...quizConfig, domain: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="">Sélectionner...</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              <Layers size={14} style={{ display: 'inline', marginRight: 4 }} />
              Catégorie *
            </label>
            <select
              value={quizConfig.category}
              onChange={(e) => setQuizConfig({ ...quizConfig, category: e.target.value })}
              disabled={!quizConfig.domain}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
                opacity: !quizConfig.domain ? 0.5 : 1,
              }}
            >
              <option value="">Sélectionner...</option>
              {quizConfig.domain && categories[quizConfig.domain]?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              <Layers size={14} style={{ display: 'inline', marginRight: 4 }} />
              Niveau *
            </label>
            <select
              value={quizConfig.level}
              onChange={(e) => setQuizConfig({ ...quizConfig, level: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="">Sélectionner...</option>
              {levels.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Matière */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
              Matière *
            </label>
            <select
              value={quizConfig.subject}
              onChange={(e) => setQuizConfig({ ...quizConfig, subject: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="">Sélectionner...</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
          {/* Type de questions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              Type de questions
            </label>
            <select
              value={quizConfig.questionType}
              onChange={(e) => setQuizConfig({ ...quizConfig, questionType: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="multiple">Choix multiple</option>
              <option value="single">Choix unique</option>
              <option value="truefalse">Vrai/Faux</option>
            </select>
          </div>

          {/* Difficulté */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              Difficulté
            </label>
            <select
              value={quizConfig.difficulty}
              onChange={(e) => setQuizConfig({ ...quizConfig, difficulty: e.target.value })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </div>

          {/* Nombre de questions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
              Nombre de questions
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={quizConfig.numQuestions}
              onChange={(e) => setQuizConfig({ ...quizConfig, numQuestions: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Mots-clés */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: 8 }}>
            <Tag size={14} style={{ display: 'inline', marginRight: 4 }} />
            Mots-clés (optionnel)
          </label>
          <input
            type="text"
            value={quizConfig.keywords}
            onChange={(e) => setQuizConfig({ ...quizConfig, keywords: e.target.value })}
            placeholder="Ex: algèbre, fonctions, équations..."
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              outline: 'none',
            }}
          />
        </div>

        {/* Bouton de génération */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%',
            padding: 16,
            background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 20px rgba(99,102,241,0.3)',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Générer le quiz avec IA
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );

  const PreviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 24,
        padding: 32,
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Eye size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f8fafc' }}>
                Aperçu du quiz généré
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {generatedQuiz?.length} questions générées
              </p>
            </div>
          </div>

          <input
            type="text"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="Nom du quiz..."
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              width: 300,
              outline: 'none',
            }}
          />
        </div>

        {/* Liste des questions */}
        <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8, marginBottom: 24 }}>
          {generatedQuiz?.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(99,102,241,0.1)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#6366f1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}>
                  {index + 1}
                </span>
                <p style={{ color: '#f8fafc', fontWeight: 500, flex: 1 }}>{q.question}</p>
                <span style={{
                  padding: '4px 8px',
                  background: q.difficulty === 'easy' ? 'rgba(16,185,129,0.1)' :
                             q.difficulty === 'medium' ? 'rgba(245,158,11,0.1)' :
                             'rgba(239,68,68,0.1)',
                  border: `1px solid ${
                    q.difficulty === 'easy' ? '#10b981' :
                    q.difficulty === 'medium' ? '#f59e0b' :
                    '#ef4444'
                  }`,
                  borderRadius: 20,
                  color: q.difficulty === 'easy' ? '#10b981' :
                         q.difficulty === 'medium' ? '#f59e0b' :
                         '#ef4444',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}>
                  {q.difficulty === 'easy' ? 'Facile' :
                   q.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {q.options.map((opt, optIndex) => {
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div
                      key={optIndex}
                      style={{
                        padding: '10px 12px',
                        background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCorrect ? '#10b981' : 'rgba(99,102,241,0.2)'}`,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
      <NavHome />
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isCorrect ? '#10b981' : '#64748b',
                        minWidth: 24,
                      }}>
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span style={{ color: isCorrect ? '#10b981' : '#94a3b8', fontSize: '0.9rem' }}>
                        {opt}
                      </span>
                      {isCorrect && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={{
                  marginTop: 8,
                  padding: 12,
                  background: 'rgba(59,130,246,0.05)',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Explication: </span>
                  {q.explanation}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep(1)}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Modifier
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Save size={16} />
            Enregistrer le quiz
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
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
              <Bot size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                CRÉATION PAR IA
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Assistant IA
            </h1>
          </div>
        </div>

        {/* Indicateur d'étape */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div
                onClick={() => step === 1 && setCurrentStep(1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentStep >= step ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${currentStep >= step ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentStep >= step ? 'white' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: step === 1 ? 'pointer' : 'default',
                }}
              >
                {step}
              </div>
              {step === 1 && (
                <div style={{
                  width: 60,
                  height: 2,
                  background: currentStep > 1 ? '#6366f1' : 'rgba(255,255,255,0.1)',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          {currentStep === 1 ? <ConfigStep /> : <PreviewStep />}
        </AnimatePresence>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
};

export default AIQuizCreation;