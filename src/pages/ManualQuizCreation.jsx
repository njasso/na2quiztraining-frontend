// src/pages/ManualQuizCreation.jsx — Version avec DOMAIN_DATA complet (IDs)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Save, ArrowLeft, FileText, User, Award,
  HelpCircle, Edit, Trash2, CheckCircle, XCircle,
  AlertCircle, Loader, BookOpen, Layers, Zap
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
import { createExam } from '../services/api';
import http from '../services/http';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  hasEducationScope,
  isScopeExemptRole,
  getVisibleSousDomaines,
  getVisibleLevels,
  getAllowedMatieres,
} from '../utils/educationScope';
import { EXAM_VISIBILITY, generateExamCode, parseAssignedList } from '../utils/examVisibility';
import ExamVisibilityPicker from '../components/ExamVisibilityPicker';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const ManualQuizCreation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateQuiz, recordQuizCreated } = useSubscription();
  const scopeLocked = hasEducationScope(user) && !isScopeExemptRole(user);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // ✅ Utilisation des IDs — pré-rempli et verrouillé au niveau de
  // l'utilisateur quand il en a un (compte élève standard)
  const [quizInfo, setQuizInfo] = useState({
    title: '',
    description: '',
    teacherName: '',
    teacherGrade: '',
    domain: scopeLocked ? user.education.domainId : '',
    sousDomaine: scopeLocked ? user.education.sousDomaineId : '',
    level: scopeLocked ? user.education.levelId : '',
    matiere: '',
    duration: 60,
    passingScore: 70,
  });
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: 'single',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswers: [],
    points: 1,
    explanation: '',
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [visibility, setVisibility] = useState(EXAM_VISIBILITY.PUBLIC);
  const [assignedToRaw, setAssignedToRaw] = useState('');
  // ✅ Document de recommandations §8 : si le format respecte le modèle
  // complet (référentiel + chapitre), proposer d'enrichir la banque
  // commune plutôt que de garder les questions strictement privées à cette
  // épreuve. Coché par défaut, décochable.
  const [chapter, setChapter] = useState('');
  const [addToBank, setAddToBank] = useState(true);
  const [savingToBank, setSavingToBank] = useState(false);

  // ✅ Options dynamiques depuis DOMAIN_DATA — restreintes au périmètre de
  // l'utilisateur (un élève ne voit que sa filière/son niveau/ses matières)
  const domains = getAllDomaines();
  const sousDomaines = quizInfo.domain ? getVisibleSousDomaines(user, quizInfo.domain) : [];
  const levels = quizInfo.sousDomaine ? getVisibleLevels(user, quizInfo.domain, quizInfo.sousDomaine) : [];
  const matieres = quizInfo.sousDomaine ? getAllowedMatieres(user, quizInfo.domain, quizInfo.sousDomaine) : [];

  // ✅ Helpers pour les noms
  const getLevelName = (levelId) => {
    return getLevelNom(quizInfo.domain, quizInfo.sousDomaine, levelId);
  };

  const getMatiereName = (matiereId) => {
    return getMatiereNom(quizInfo.domain, quizInfo.sousDomaine, matiereId);
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
    }
  };

  const toggleCorrectOption = (option) => {
    if (currentQuestion.type === 'single') {
      setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }));
    } else {
      const newCorrectAnswers = currentQuestion.correctAnswers.includes(option)
        ? currentQuestion.correctAnswers.filter(a => a !== option)
        : [...currentQuestion.correctAnswers, option];
      setCurrentQuestion(prev => ({ ...prev, correctAnswers: newCorrectAnswers }));
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast.error('Veuillez saisir l\'énoncé de la question');
      return;
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Veuillez ajouter au moins 2 options valides');
      return;
    }

    const hasCorrectAnswer = currentQuestion.type === 'single'
      ? currentQuestion.correctAnswer
      : currentQuestion.correctAnswers.length > 0;

    if (!hasCorrectAnswer) {
      toast.error('Veuillez sélectionner la/les bonne(s) réponse(s)');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      options: filledOptions,
    };

    if (editingIndex >= 0) {
      const updated = [...questions];
      updated[editingIndex] = newQuestion;
      setQuestions(updated);
      setEditingIndex(-1);
      toast.success('Question modifiée avec succès');
    } else {
      setQuestions([...questions, newQuestion]);
      toast.success('Question ajoutée avec succès');
    }

    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      text: '',
      type: 'single',
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswers: [],
      points: 1,
      explanation: '',
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestion(questions[index]);
    setEditingIndex(index);
  };

  const deleteQuestion = (index) => {
    if (window.confirm('Supprimer cette question ?')) {
      setQuestions(questions.filter((_, i) => i !== index));
      toast.success('Question supprimée');
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizInfo.title || !quizInfo.teacherName || !quizInfo.domain || !quizInfo.sousDomaine || !quizInfo.level || !quizInfo.matiere) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (questions.length === 0) {
      toast.error('Veuillez ajouter au moins une question');
      return;
    }

    // 🔒 Garde anti-contournement : la sélection doit rester dans le
    // périmètre de l'utilisateur même si le formulaire a été manipulé.
    if (scopeLocked) {
      const stillAllowed =
        String(quizInfo.domain) === String(user.education.domainId) &&
        String(quizInfo.sousDomaine) === String(user.education.sousDomaineId) &&
        String(quizInfo.level) === String(user.education.levelId);
      if (!stillAllowed) {
        toast.error("Cette sélection ne correspond pas à votre niveau d'étude.");
        return;
      }
    }

    // 🔒 Limite du plan d'abonnement (ex: 5 quiz/jour en Gratuit).
    if (!canCreateQuiz()) return;

    setLoading(true);
    
    try {
      // ✅ Récupérer les noms pour les métadonnées
      const levelNom = getLevelName(quizInfo.level);
      const matiereNom = getMatiereName(quizInfo.matiere);

      // ✅ Formater les questions pour l'API
      const formattedQuestions = questions.map(q => ({
        question: q.text,
        text: q.text,
        options: q.options,
        answer: q.type === 'single' ? q.correctAnswer : q.correctAnswers,
        correctAnswer: q.type === 'single' ? q.correctAnswer : q.correctAnswers,
        points: q.points,
        explanation: q.explanation || '',
        type: q.type
      }));

      const examData = {
        title: quizInfo.title,
        description: quizInfo.description || '',
        domain: quizInfo.domain,
        sousDomaine: quizInfo.sousDomaine,
        level: quizInfo.level,
        matiere: quizInfo.matiere,
        levelNom: levelNom,
        matiereNom: matiereNom,
        questions: formattedQuestions,
        duration: quizInfo.duration,
        passingScore: quizInfo.passingScore,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        source: 'manual',
        createdBy: user?._id || user?.id,
        teacherName: quizInfo.teacherName,
        teacherGrade: quizInfo.teacherGrade,
        // ✅ Destinataires de l'épreuve (document de recommandations §7)
        visibility,
        isPublic: visibility === EXAM_VISIBILITY.PUBLIC,
        assignedTo: visibility === EXAM_VISIBILITY.ASSIGNED ? parseAssignedList(assignedToRaw) : [],
        code: generateExamCode(
          getDomainCode(quizInfo.domain),
          getMatiereCode(quizInfo.domain, quizInfo.sousDomaine, quizInfo.matiere),
          levelNom
        ),
        metadata: {
          createdAt: new Date().toISOString(),
          type: 'manual',
          questionCount: questions.length
        }
      };

      console.log('📦 Envoi de l\'examen:', examData);
      
      const response = await createExam(examData);

      if (response.success) {
        recordQuizCreated();
        toast.success('Épreuve créée avec succès !');
        if (visibility !== EXAM_VISIBILITY.PRIVATE) {
          toast(`Code de partage : ${examData.code}`, { icon: '🔗', duration: 8000 });
        }

        // ✅ Document de recommandations §8 : verser les questions à la
        // banque commune si le formateur l'a demandé et que le référentiel
        // est complet (chapitre renseigné). Échec silencieux question par
        // question : un rejet réseau sur l'une d'elles ne doit pas remettre
        // en cause l'épreuve déjà créée avec succès.
        if (addToBank && chapter.trim()) {
          setSavingToBank(true);
          const status = ['admin', 'superadmin'].includes(user?.role) ? 'approved' : 'pending';
          let okCount = 0;
          for (const q of questions) {
            try {
              await http.post('/questions', {
                text: q.text,
                options: q.options,
                correctAnswer: q.type === 'single' ? q.correctAnswer : undefined,
                correctAnswers: q.type !== 'single' ? q.correctAnswers : undefined,
                type: q.type,
                points: q.points,
                explanation: q.explanation || '',
                domainId: quizInfo.domain,
                sousDomaineId: quizInfo.sousDomaine,
                levelId: quizInfo.level,
                matiereId: quizInfo.matiere,
                chapter: chapter.trim(),
                origine: 'formateur',
                status,
                matriculeAuteur: user?.matricule || user?.email || '',
              });
              okCount += 1;
            } catch (bankErr) {
              console.error('❌ Question non ajoutée à la banque :', bankErr);
            }
          }
          setSavingToBank(false);
          if (okCount > 0) {
            toast.success(
              status === 'approved'
                ? `${okCount} question(s) ajoutée(s) à la banque commune.`
                : `${okCount} question(s) envoyée(s) à la banque, en attente de validation admin.`,
              { duration: 6000 }
            );
          }
        }

        navigate('/exams');
      } else {
        throw new Error(response.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('❌ Erreur création examen:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // ─── Composant Étape 1: Informations ────────────────────────────────────────

  const QuizInfoStep = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 24,
        padding: 32,
      }}
    >
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', marginBottom: 24 }}>
        Informations générales
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            <User size={14} style={{ display: 'inline', marginRight: 4 }} />
            Nom de l'enseignant *
          </label>
          <input
            type="text"
            value={quizInfo.teacherName}
            onChange={(e) => setQuizInfo({ ...quizInfo, teacherName: e.target.value })}
            placeholder="Ex: M. Jean Dupont"
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

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            <Award size={14} style={{ display: 'inline', marginRight: 4 }} />
            Grade / Titre *
          </label>
          <input
            type="text"
            value={quizInfo.teacherGrade}
            onChange={(e) => setQuizInfo({ ...quizInfo, teacherGrade: e.target.value })}
            placeholder="Ex: Professeur de Mathématiques"
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

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
          <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
          Titre du quiz *
        </label>
        <input
          type="text"
          value={quizInfo.title}
          onChange={(e) => setQuizInfo({ ...quizInfo, title: e.target.value })}
          placeholder="Ex: Évaluation de Mathématiques - Chapitre 5"
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

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
          Description
        </label>
        <textarea
          value={quizInfo.description}
          onChange={(e) => setQuizInfo({ ...quizInfo, description: e.target.value })}
          rows={3}
          placeholder="Décrivez brièvement le contenu du quiz..."
          style={{
            width: '100%',
            padding: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10,
            color: '#f8fafc',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
            Domaine *
          </label>
          <select
            value={quizInfo.domain}
            onChange={(e) => setQuizInfo({ ...quizInfo, domain: e.target.value, sousDomaine: '', level: '', matiere: '' })}
            disabled={scopeLocked}
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              outline: 'none',
              opacity: scopeLocked ? 0.6 : 1,
            }}
          >
            <option value="">Sélectionner...</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
        </div>

        {quizInfo.domain && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              <Layers size={14} style={{ display: 'inline', marginRight: 4 }} />
              Sous-domaine *
            </label>
            <select
              value={quizInfo.sousDomaine}
              onChange={(e) => setQuizInfo({ ...quizInfo, sousDomaine: e.target.value, level: '', matiere: '' })}
              disabled={scopeLocked}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
                opacity: scopeLocked ? 0.6 : 1,
              }}
            >
              <option value="">Sélectionner...</option>
              {sousDomaines.map(sd => (
                <option key={sd.id} value={sd.id}>{sd.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {quizInfo.sousDomaine && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              <Zap size={14} style={{ display: 'inline', marginRight: 4 }} />
              Niveau *
            </label>
            <select
              value={quizInfo.level}
              onChange={(e) => setQuizInfo({ ...quizInfo, level: e.target.value })}
              disabled={scopeLocked}
              style={{
                width: '100%',
                padding: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
                opacity: scopeLocked ? 0.6 : 1,
              }}
            >
              <option value="">Sélectionner...</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
              Matière *
            </label>
            <select
              value={quizInfo.matiere}
              onChange={(e) => setQuizInfo({ ...quizInfo, matiere: e.target.value })}
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
              {matieres.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            Durée (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={quizInfo.duration}
            onChange={(e) => setQuizInfo({ ...quizInfo, duration: Number(e.target.value) })}
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

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            Seuil de réussite (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={quizInfo.passingScore}
            onChange={(e) => setQuizInfo({ ...quizInfo, passingScore: Number(e.target.value) })}
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

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
          <Layers size={14} style={{ display: 'inline', marginRight: 4 }} />
          Chapitre (pour la banque commune)
        </label>
        <input
          type="text"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          placeholder="Ex: Équations du premier degré"
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

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20,
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
      }}>
        <input
          type="checkbox"
          id="addToBank"
          checked={addToBank}
          onChange={(e) => setAddToBank(e.target.checked)}
          disabled={!chapter.trim()}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: '#10b981' }}
        />
        <label htmlFor="addToBank" style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: chapter.trim() ? 'pointer' : 'not-allowed' }}>
          <strong style={{ color: '#e2e8f0' }}>Ajouter ces questions à la banque commune</strong>
          <br />
          {chapter.trim()
            ? "Elles seront réutilisables par d'autres formateurs pour ce référentiel, après validation par un administrateur."
            : 'Renseignez le chapitre ci-dessus pour activer cette option — sans lui, le référentiel est incomplet et les questions resteront privées à cette épreuve.'}
        </label>
      </div>

      <ExamVisibilityPicker
        visibility={visibility}
        onVisibilityChange={setVisibility}
        assignedToRaw={assignedToRaw}
        onAssignedToChange={setAssignedToRaw}
      />
    </motion.div>
  );

  // ─── Composant Étape 2: Questions ────────────────────────────────────────────

  const QuestionsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Formulaire de question */}
      <div style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 24,
        padding: 32,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', marginBottom: 24 }}>
          {editingIndex >= 0 ? `Modifier la question ${editingIndex + 1}` : 'Nouvelle question'}
        </h2>

        {/* Énoncé */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            <HelpCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
            Énoncé de la question *
          </label>
          <textarea
            value={currentQuestion.text}
            onChange={(e) => handleQuestionChange('text', e.target.value)}
            rows={3}
            placeholder="Saisissez votre question ici..."
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Type et points */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              Type de question
            </label>
            <select
              value={currentQuestion.type}
              onChange={(e) => handleQuestionChange('type', e.target.value)}
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
              <option value="single">Choix unique</option>
              <option value="multiple">Choix multiple</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
              Points
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={currentQuestion.points}
              onChange={(e) => handleQuestionChange('points', Number(e.target.value))}
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

        {/* Options */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            Options de réponse *
          </label>
          {currentQuestion.options.map((opt, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: 24 }}>
                {String.fromCharCode(65 + index)}.
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{
                  flex: 1,
                  padding: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => toggleCorrectOption(opt)}
                type="button"
                style={{
                  padding: 8,
                  background: (currentQuestion.type === 'single' ? currentQuestion.correctAnswer === opt : currentQuestion.correctAnswers.includes(opt))
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${(currentQuestion.type === 'single' ? currentQuestion.correctAnswer === opt : currentQuestion.correctAnswers.includes(opt))
                    ? '#10b981'
                    : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 8,
                  color: (currentQuestion.type === 'single' ? currentQuestion.correctAnswer === opt : currentQuestion.correctAnswers.includes(opt))
                    ? '#10b981'
                    : '#94a3b8',
                  cursor: 'pointer',
                }}
                title={currentQuestion.type === 'single' ? 'Marquer comme bonne réponse' : 'Ajouter/Retirer des bonnes réponses'}
              >
                <CheckCircle size={16} />
              </button>
              {currentQuestion.options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  type="button"
                  style={{
                    padding: 8,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          ))}

          {currentQuestion.options.length < 6 && (
            <button
              onClick={addOption}
              type="button"
              style={{
                padding: '8px 16px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#a5b4fc',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              + Ajouter une option
            </button>
          )}
        </div>

        {/* Explication */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>
            Explication (optionnel)
          </label>
          <textarea
            value={currentQuestion.explanation}
            onChange={(e) => handleQuestionChange('explanation', e.target.value)}
            rows={2}
            placeholder="Expliquez la réponse pour aider l'étudiant..."
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: '#f8fafc',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Bouton d'ajout */}
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addQuestion}
            type="button"
            style={{
              flex: 1,
              padding: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={18} />
            {editingIndex >= 0 ? 'Modifier la question' : 'Ajouter la question'}
          </motion.button>

          {editingIndex >= 0 && (
            <button
              onClick={() => {
                setEditingIndex(-1);
                resetQuestionForm();
              }}
              type="button"
              style={{
                padding: '14px 24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Liste des questions */}
      {questions.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              Questions ajoutées ({questions.length})
            </h3>
            <span style={{
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              borderRadius: 12,
              color: '#a5b4fc',
              fontSize: '0.8rem',
            }}>
              Total: {questions.reduce((sum, q) => sum + q.points, 0)} points
            </span>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
            {questions.map((q, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(99,102,241,0.1)',
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: '#6366f1',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ color: '#f8fafc', fontWeight: 500 }}>{q.text}</span>
                      <span style={{
                        padding: '2px 6px',
                        background: 'rgba(245,158,11,0.1)',
                        borderRadius: 4,
                        color: '#f59e0b',
                        fontSize: '0.7rem',
                      }}>
                        {q.points} pt{q.points > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 32 }}>
                      {q.options.map((opt, i) => {
                        const isCorrect = q.type === 'single' 
                          ? opt === q.correctAnswer 
                          : q.correctAnswers.includes(opt);
                        return (
                          <span
                            key={i}
                            style={{
                              padding: '2px 8px',
                              background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isCorrect ? '#10b981' : 'rgba(99,102,241,0.2)'}`,
                              borderRadius: 4,
                              color: isCorrect ? '#10b981' : '#94a3b8',
                              fontSize: '0.7rem',
                            }}
                          >
                            {String.fromCharCode(65 + i)}: {opt}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => editQuestion(index)}
                      style={{
                        padding: 6,
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 6,
                        color: '#f59e0b',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => deleteQuestion(index)}
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
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // ─── Rendu principal ──────────────────────────────────────────────────────────

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

      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
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

          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Création manuelle
            </h1>
            <p style={{ color: '#64748b' }}>
              Créez votre épreuve question par question
            </p>
          </div>
        </div>

        {/* Indicateur d'étape */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div
                onClick={() => setCurrentStep(step)}
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
                  cursor: 'pointer',
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
          {currentStep === 1 ? <QuizInfoStep /> : <QuestionsStep />}
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button
            onClick={() => setCurrentStep(1)}
            disabled={currentStep === 1}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10,
              color: currentStep === 1 ? '#4b5563' : '#94a3b8',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 ? 0.5 : 1,
            }}
          >
            Précédent
          </button>

          {currentStep === 1 ? (
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSaveQuiz}
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer l'épreuve
                </>
              )}
            </button>
          )}
        </div>
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

export default ManualQuizCreation;