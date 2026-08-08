// src/pages/GenerateQuizPage.jsx - Version avec DOMAIN_DATA complet
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Loader2, Save, ArrowLeft, Bot,
  Settings, Eye, BookOpen, Layers, Tag,
  AlertCircle, CheckCircle, RefreshCw, Zap
} from 'lucide-react';
import DOMAIN_DATA, { 
  getAllDomaines, 
  getAllSousDomaines, 
  getAllLevels, 
  getAllMatieres,
  getLevelNom,
  getMatiereNom,
  getDomainCode,
  getMatiereCode
} from '../data/domainConfig';
import { generateQuestions, createExam } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { EXAM_VISIBILITY, generateExamCode, parseAssignedList } from '../utils/examVisibility';
import ExamVisibilityPicker from '../components/ExamVisibilityPicker';
import {
  hasEducationScope,
  isScopeExemptRole,
  getVisibleSousDomaines,
  getVisibleLevels,
  getAllowedMatieres,
  formatScopeLabel,
} from '../utils/educationScope';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const GenerateQuizPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUseAI, recordAIUsed, remainingAIToday, limits } = useSubscription();

  // Un élève/étudiant standard est enfermé dans son propre périmètre
  // (domaine + filière + niveau déjà choisis dans ChooseLevelPage) : on ne
  // lui laisse choisir QUE la matière. Un formateur/admin garde le libre
  // choix pour créer du contenu multi-niveaux.
  const scopeLocked = hasEducationScope(user) && !isScopeExemptRole(user);

  // État du formulaire - Utilisation des IDs
  const [selectedDomain, setSelectedDomain] = useState(
    scopeLocked ? user.education.domainId : ''
  );
  const [selectedSousDomaine, setSelectedSousDomaine] = useState(
    scopeLocked ? user.education.sousDomaineId : ''
  );
  const [selectedLevel, setSelectedLevel] = useState(
    scopeLocked ? user.education.levelId : ''
  );
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [questionType, setQuestionType] = useState('single');
  const [numQuestions, setNumQuestions] = useState(10);
  const [keywords, setKeywords] = useState('');
  // CORRECTION (audit strategique 1.8) : aucune capacite d'edition des
  // questions generees par IA avant enregistrement — l'utilisateur devait
  // accepter tel quel. Ajout d'un mode edition par carte de question.
  const [editingQIndex, setEditingQIndex] = useState(null);
  // CORRECTION (audit strategique 1.5) : filtre/etiquette chapitre generalise
  // a cette page — sert d'indice facultatif pour l'IA (aucune validation ne bloque).
  const [libChapitre, setLibChapitre] = useState('');
  
  // État de l'application
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [visibility, setVisibility] = useState(EXAM_VISIBILITY.PUBLIC);
  const [assignedToRaw, setAssignedToRaw] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);

  // ✅ Options dynamiques depuis DOMAIN_DATA — restreintes au périmètre de
  // l'utilisateur (voir src/utils/educationScope.js). Un formateur/admin
  // continue de voir toutes les options.
  const domains = getAllDomaines();
  const sousDomaines = selectedDomain ? getVisibleSousDomaines(user, selectedDomain) : [];
  const levels = selectedSousDomaine ? getVisibleLevels(user, selectedDomain, selectedSousDomaine) : [];
  const matieres = selectedSousDomaine ? getAllowedMatieres(user, selectedDomain, selectedSousDomaine) : [];

  // Vérification de l'authentification
  useEffect(() => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
    }
  }, [user, navigate]);

  // Reset des sélections (uniquement si l'utilisateur a le libre choix —
  // un compte élève au périmètre verrouillé garde toujours son
  // domaine/filière/niveau, seule la matière change)
  useEffect(() => {
    if (scopeLocked) return;
    setSelectedSousDomaine('');
    setSelectedLevel('');
    setSelectedMatiere('');
    setGeneratedQuiz(null);
    setError(null);
  }, [selectedDomain]);

  useEffect(() => {
    if (scopeLocked) return;
    setSelectedLevel('');
    setSelectedMatiere('');
    setGeneratedQuiz(null);
    setError(null);
  }, [selectedSousDomaine]);

  // Simulation de progression
  useEffect(() => {
    let interval;
    if (isLoading) {
      setGenerationProgress(0);
      interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // ✅ HANDLE GENERATE - Utilisation des IDs
  const handleGenerate = async () => {
    if (!selectedDomain || !selectedSousDomaine || !selectedLevel || !selectedMatiere) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // 🔒 Garde anti-contournement : même si le formulaire est verrouillé
    // par l'UI, on revérifie ici que la sélection reste dans le périmètre
    // de l'utilisateur avant tout appel réseau (ex: state manipulé via les
    // devtools, ou changement de user.education en cours de session).
    if (scopeLocked) {
      const stillAllowed =
        String(selectedDomain) === String(user.education.domainId) &&
        String(selectedSousDomaine) === String(user.education.sousDomaineId) &&
        String(selectedLevel) === String(user.education.levelId);
      if (!stillAllowed) {
        toast.error("Cette sélection ne correspond pas à votre niveau d'étude.");
        return;
      }
    }

    // 🔒 Limite du plan d'abonnement (ex: 3 générations IA/jour en Gratuit).
    // Bloque et redirige vers /subscription si la limite est atteinte.
    if (!canUseAI()) return;

    setIsLoading(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Récupérer les noms pour le titre
      const levelNom = getLevelNom(selectedDomain, selectedSousDomaine, selectedLevel);
      const matiereNom = getMatiereNom(selectedDomain, selectedSousDomaine, selectedMatiere);

      const requestData = {
        domainId: selectedDomain,
        sousDomaineId: selectedSousDomaine,
        levelId: selectedLevel,
        matiereId: selectedMatiere,
        numQuestions: numQuestions,
        type: questionType === 'multiple' ? 'multiple' : 'qcm',
        keywords: keywords || undefined,
        libChapitre: libChapitre || undefined,
      };

      console.log('🚀 Envoi au backend:', requestData);
      
      // ✅ Appel API
      const response = await generateQuestions(requestData);
      console.log('📦 Réponse reçue:', response);

      // Traiter la réponse
      let questions = [];
      if (response && response.questions && Array.isArray(response.questions)) {
        questions = response.questions;
      } else if (response && response.data && Array.isArray(response.data)) {
        questions = response.data;
      } else if (Array.isArray(response)) {
        questions = response;
      }

      if (questions.length === 0) {
        throw new Error('Aucune question générée');
      }

      // Comptabiliser cette génération dans le quota quotidien du plan
      // (voir SubscriptionContext.recordAIUsed).
      recordAIUsed();

      const formattedQuestions = questions.map((q, index) => ({
        id: index + 1,
        text: q.text || q.question || `Question ${index + 1}`,
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.answer || q.correctAnswer || q.options?.[0] || '',
        explanation: q.explanation || '',
        points: q.points || 1,
        difficulty: q.difficulty || 'moyen'
      }));

      setGeneratedQuiz({
        title: `${matiereNom || 'Quiz'} - ${levelNom || 'Niveau'}`,
        description: response.metadata?.description || `Quiz généré sur ${matiereNom || 'la matière'}`,
        questions: formattedQuestions,
        metadata: {
          domain: selectedDomain,
          sousDomaine: selectedSousDomaine,
          level: selectedLevel,
          matiere: selectedMatiere,
          levelNom: levelNom,
          matiereNom: matiereNom
        }
      });

      setQuizName(`${matiereNom || 'Quiz'} - ${levelNom || 'Niveau'}`);
      setGenerationProgress(100);
      setTimeout(() => setCurrentStep(2), 500);
      toast.success(`${formattedQuestions.length} questions générées !`);

    } catch (error) {
      console.error('❌ Erreur génération:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erreur lors de la génération';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedQuiz(null);
    setCurrentStep(1);
    setError(null);
    handleGenerate();
  };

  // Sauvegarde du quiz
  const handleSave = async () => {
    if (!generatedQuiz || !quizName) {
      toast.error('Veuillez générer un quiz et lui donner un nom');
      return;
    }

    setIsLoading(true);
    try {
      const formattedQuestions = generatedQuiz.questions.map(q => ({
        question: q.text,
        text: q.text,
        options: q.options,
        answer: q.correctAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        points: q.points || 1,
        type: questionType
      }));

      const examData = {
        title: quizName,
        domain: selectedDomain,
        sousDomaine: selectedSousDomaine,
        level: selectedLevel,
        matiere: selectedMatiere,
        questions: formattedQuestions,
        duration: 60,
        passingScore: 70,
        totalPoints: generatedQuiz.questions.reduce((sum, q) => sum + (q.points || 1), 0),
        source: 'ai_generated',
        createdBy: user?._id || user?.id,
        // ✅ Destinataires de l'épreuve (document de recommandations §7)
        visibility,
        isPublic: visibility === EXAM_VISIBILITY.PUBLIC,
        assignedTo: visibility === EXAM_VISIBILITY.ASSIGNED ? parseAssignedList(assignedToRaw) : [],
        code: generateExamCode(
          getDomainCode(selectedDomain),
          getMatiereCode(selectedDomain, selectedSousDomaine, selectedMatiere),
          getLevelNom(selectedDomain, selectedSousDomaine, selectedLevel)
        ),
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'deepseek-chat',
          keywords: keywords
        }
      };

      console.log('📦 Sauvegarde de l\'épreuve:', examData);
      
      const response = await createExam(examData);

      if (response.success) {
        toast.success('Épreuve enregistrée avec succès !');
        if (visibility !== EXAM_VISIBILITY.PRIVATE) {
          toast(`Code de partage : ${examData.code}`, { icon: '🔗', duration: 8000 });
        }
        navigate('/exams');
      } else {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Composants ──────────────────────────────────────────────────────────────

  const ConfigStep = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div style={styles.card}>
        {error && (
          <div style={{
            ...styles.statusBadge,
            background: 'rgba(239,68,68,0.1)',
            borderColor: '#ef4444',
            marginBottom: 24,
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>{error}</span>
          </div>
        )}

        <div style={styles.sectionHeader}>
          <div style={styles.iconContainer}>
            <Settings size={20} color="white" />
          </div>
          <div>
            <h2 style={styles.sectionTitle}>Configuration du quiz</h2>
            <p style={styles.sectionSubtitle}>Paramétrez les critères de génération</p>
          </div>
        </div>

        {scopeLocked && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            color: '#a5b4fc', fontSize: '0.8rem',
          }}>
            <Layers size={14} />
            Votre niveau : <strong>{formatScopeLabel(user)}</strong>
            <span style={{ marginLeft: 'auto', color: '#64748b' }}>
              {remainingAIToday === Infinity
                ? 'Générations IA illimitées'
                : `${remainingAIToday}/${limits.aiPerDay} générations IA restantes aujourd'hui`}
            </span>
          </div>
        )}

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>
              <BookOpen size={14} style={{ marginRight: 4 }} />
              Domaine *
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              disabled={scopeLocked}
              style={{ ...styles.select, opacity: scopeLocked ? 0.6 : 1 }}
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
              onChange={(e) => setSelectedSousDomaine(e.target.value)}
              disabled={!selectedDomain || scopeLocked}
              style={{...styles.select, opacity: (!selectedDomain || scopeLocked) ? 0.6 : 1}}
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
              disabled={!selectedSousDomaine || scopeLocked}
              style={{...styles.select, opacity: (!selectedSousDomaine || scopeLocked) ? 0.6 : 1}}
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

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Type de questions</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              style={styles.select}
            >
              <option value="single">Choix unique</option>
              <option value="multiple">Choix multiple</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Nombre de questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={styles.label}>
            <Tag size={14} style={{ marginRight: 4 }} />
            Mots-clés (optionnel)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Ex: management, stratégie, leadership..."
            style={styles.input}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={styles.label}>
            <Tag size={14} style={{ marginRight: 4 }} />
            Chapitre (facultatif)
          </label>
          <input
            type="text"
            value={libChapitre}
            onChange={(e) => setLibChapitre(e.target.value)}
            placeholder="Ex: Fonctions numériques — guide l'IA sans être obligatoire"
            style={styles.input}
          />
        </div>

        {isLoading && (
          <div style={{ marginBottom: 20 }}>
            <div style={styles.progressHeader}>
              <span style={{ color: '#94a3b8' }}>Génération en cours...</span>
              <span style={{ color: '#a5b4fc' }}>{generationProgress}%</span>
            </div>
            <div style={styles.progressBar}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${generationProgress}%` }}
                style={styles.progressFill}
              />
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isLoading || !selectedMatiere}
          style={{
            ...styles.generateButton,
            background: isLoading || !selectedMatiere ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            cursor: isLoading || !selectedMatiere ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Générer le quiz
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
      <div style={styles.card}>
        <div style={styles.previewHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{...styles.iconContainer, background: 'linear-gradient(135deg, #10b981, #059669)'}}>
              <Eye size={20} color="white" />
            </div>
            <div>
              <h2 style={styles.sectionTitle}>Aperçu du quiz</h2>
              <p style={styles.sectionSubtitle}>
                {generatedQuiz?.questions?.length || 0} questions
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="Nom du quiz..."
              style={styles.quizNameInput}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              style={styles.regenerateButton}
              title="Régénérer"
            >
              <RefreshCw size={18} />
            </motion.button>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          <ExamVisibilityPicker
            visibility={visibility}
            onVisibilityChange={setVisibility}
            assignedToRaw={assignedToRaw}
            onAssignedToChange={setAssignedToRaw}
          />
        </div>

        <div style={styles.questionList}>
          {generatedQuiz?.questions?.map((q, index) => {
            const isEditing = editingQIndex === index;

            const updateQuestion = (patch) => {
              setGeneratedQuiz(prev => ({
                ...prev,
                questions: prev.questions.map((qq, i) => i === index ? { ...qq, ...patch } : qq),
              }));
            };

            return (
              <motion.div
                key={q.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ ...styles.questionCard, border: isEditing ? '1px solid #6366f1' : styles.questionCard.border }}
              >
                <div style={styles.questionHeader}>
                  <span style={styles.questionNumber}>{index + 1}</span>
                  {isEditing ? (
                    <textarea
                      value={q.text}
                      onChange={(e) => updateQuestion({ text: e.target.value })}
                      rows={2}
                      style={{ ...styles.questionText, width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: 8, resize: 'vertical' }}
                    />
                  ) : (
                    <p style={styles.questionText}>{q.text}</p>
                  )}
                  <span style={{
                    ...styles.difficultyBadge,
                    background: 'rgba(245,158,11,0.1)',
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                  }}>
                    {q.points} pt{q.points > 1 ? 's' : ''}
                  </span>
                  {/* CORRECTION (audit strategique 1.8) : edition avant validation */}
                  <button
                    type="button"
                    onClick={() => setEditingQIndex(isEditing ? null : index)}
                    style={{
                      marginLeft: 8, padding: '6px 12px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 600,
                      background: isEditing ? '#10b981' : 'rgba(99,102,241,0.15)',
                      color: isEditing ? '#fff' : '#a5b4fc', border: 'none', cursor: 'pointer',
                    }}
                  >
                    {isEditing ? 'Terminer' : 'Modifier'}
                  </button>
                </div>

                <div style={styles.optionsGrid}>
                  {q.options?.map((opt, optIndex) => {
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <div
                        key={optIndex}
                        style={{
                          ...styles.option,
                          background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                          borderColor: isCorrect ? '#10b981' : 'rgba(99,102,241,0.2)',
                        }}
                      >
                        <span style={{
                          ...styles.optionLetter,
                          color: isCorrect ? '#10b981' : '#64748b',
                        }}>
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const wasCorrect = opt === q.correctAnswer;
                              const newOptions = q.options.map((o, i) => i === optIndex ? e.target.value : o);
                              updateQuestion({
                                options: newOptions,
                                correctAnswer: wasCorrect ? e.target.value : q.correctAnswer,
                              });
                            }}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.85rem' }}
                          />
                        ) : (
                          <span style={{
                            ...styles.optionText,
                            color: isCorrect ? '#10b981' : '#94a3b8',
                          }}>
                            {opt}
                          </span>
                        )}
                        {isEditing ? (
                          <button
                            type="button"
                            title="Marquer comme bonne réponse"
                            onClick={() => updateQuestion({ correctAnswer: opt })}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: isCorrect ? '#10b981' : '#475569',
                            }}
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : (
                          isCorrect && <CheckCircle size={14} color="#10b981" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {isEditing ? (
                  <textarea
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion({ explanation: e.target.value })}
                    placeholder="Explication (facultatif)"
                    rows={2}
                    style={{ width: '100%', marginTop: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: 8, color: '#cbd5e1', fontSize: '0.8rem', resize: 'vertical' }}
                  />
                ) : q.explanation && (
                  <div style={styles.explanation}>
                    <span style={{ color: '#94a3b8' }}>💡 </span>
                    {q.explanation}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={styles.actionButtons}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep(1)}
            style={styles.editButton}
          >
            Modifier
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isLoading}
            style={{
              ...styles.saveButton,
              background: isLoading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={16} />
                Enregistrer l'épreuve
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGrid} />
      <div style={styles.glowEffect} />

      <main style={styles.main}>
        <div style={styles.header}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <div style={styles.aiBadge}>
              <Bot size={14} color="#6366f1" />
              <span>GÉNÉRATION PAR IA</span>
            </div>
            <h1 style={styles.title}>Générateur Intelligent</h1>
          </div>
        </div>

        <div style={styles.stepIndicator}>
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div style={{
                ...styles.stepCircle,
                background: currentStep >= step ? '#6366f1' : 'rgba(255,255,255,0.05)',
                borderColor: currentStep >= step ? '#6366f1' : 'rgba(99,102,241,0.2)',
                color: currentStep >= step ? 'white' : '#64748b',
              }}>
                {step}
              </div>
              {step === 1 && (
                <div style={{
                  ...styles.stepLine,
                  background: currentStep > 1 ? '#6366f1' : 'rgba(255,255,255,0.1)',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

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
  aiBadge: {
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
    margin: 0,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  stepLine: {
    width: 60,
    height: 2,
  },
  card: {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 24,
    padding: 32,
  },
  statusBadge: {
    padding: 12,
    border: '1px solid',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#f8fafc',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: 0,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 20,
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
  input: {
    width: '100%',
    padding: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10,
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    width: '100%',
    height: 6,
    background: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    borderRadius: 3,
  },
  generateButton: {
    width: '100%',
    padding: 16,
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  quizNameInput: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10,
    color: '#f8fafc',
    width: 300,
    outline: 'none',
  },
  regenerateButton: {
    padding: '10px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 10,
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  questionList: {
    maxHeight: 500,
    overflowY: 'auto',
    paddingRight: 8,
    marginBottom: 24,
  },
  questionCard: {
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
  difficultyBadge: {
    padding: '2px 8px',
    border: '1px solid',
    borderRadius: 12,
    fontSize: '0.6rem',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 8,
  },
  option: {
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  optionLetter: {
    fontSize: '0.7rem',
    fontWeight: 600,
    minWidth: 20,
  },
  optionText: {
    fontSize: '0.9rem',
    flex: 1,
  },
  explanation: {
    marginTop: 8,
    padding: 8,
    background: 'rgba(59,130,246,0.05)',
    borderRadius: 8,
    fontSize: '0.8rem',
    color: '#64748b',
  },
  actionButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  editButton: {
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10,
    color: '#94a3b8',
    cursor: 'pointer',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    border: 'none',
    borderRadius: 10,
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default GenerateQuizPage;