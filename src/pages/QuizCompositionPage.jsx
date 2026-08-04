// src/pages/QuizCompositionPage.jsx — VERSION FINALE CORRIGÉE
// ✅ Correction : handlePrintBulletin définie
// ✅ Correction : Toutes les fonctions définies avant utilisation
// ✅ Correction : Gestion complète des erreurs

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Loader,
  Award,
  FileText,
  Download,
  Printer,
  User,
  Calendar,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useSubscription } from "../contexts/SubscriptionContext";

import NavHome from '../components/NavHome';
// ============================================
// CONSTANTES
// ============================================
const PROGRESS_KEY = "quiz_composition_progress";
const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:5000";

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

const normalizeExam = (rawExam) => {
  if (!rawExam) return null;

  let questions = [];
  if (Array.isArray(rawExam.questions)) {
    questions = rawExam.questions;
  } else if (rawExam.data?.questions && Array.isArray(rawExam.data.questions)) {
    questions = rawExam.data.questions;
  }

  const normalizedQuestions = questions.map((q, index) => ({
    id: q._id || q.id || `q-${index}`,
    text: q.text || q.question || q.title || `Question ${index + 1}`,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.correctAnswer || q.answer || "",
    explanation: q.explanation || "",
    points: q.points || 1,
  }));

  const totalPoints = normalizedQuestions.reduce((sum, q) => sum + q.points, 0);

  return {
    id: rawExam._id || rawExam.id,
    title: rawExam.title || rawExam.name || "Examen sans titre",
    description: rawExam.description || "",
    domain: rawExam.domain || rawExam.category || "Général",
    domainNom: rawExam.domainNom || rawExam.domain || "Général",
    level: rawExam.level || "Débutant",
    levelNom: rawExam.levelNom || rawExam.level || "Débutant",
    subject: rawExam.subject || "Général",
    matiereNom: rawExam.matiereNom || rawExam.subject || "Général",
    duration: rawExam.duration || 60,
    passingScore: rawExam.passingScore || 70,
    questions: normalizedQuestions,
    totalQuestions: normalizedQuestions.length,
    totalPoints: totalPoints || normalizedQuestions.length,
  };
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const QuizCompositionPage = () => {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canExportBulletin, recordExport } = useSubscription();

  // États
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [detailedResults, setDetailedResults] = useState([]);
  const [resultId, setResultId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  // ============================================
  // CHARGEMENT DE L'EXAMEN
  // ============================================
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        setError(null);

        let rawExamData = null;

        try {
          const stored = localStorage.getItem("studentInfoForExam");
          if (stored) {
            const parsed = JSON.parse(stored);
            setStudentInfo(parsed.info || parsed);
          }
        } catch (e) {
          console.warn("Erreur récupération infos étudiant:", e);
        }

        if (location.state?.exam) {
          rawExamData = location.state.exam;
        } else if (examId) {
          try {
            const response = await api.get(`/exams/${examId}`);
            if (response.data?.success && response.data?.data) {
              rawExamData = response.data.data;
            } else if (response.data?.data) {
              rawExamData = response.data.data;
            } else {
              rawExamData = response.data;
            }
          } catch (apiError) {
            console.error("Erreur API:", apiError);
            const token =
              localStorage.getItem("userToken") ||
              localStorage.getItem("token");
            const fetchResponse = await fetch(
              `${BACKEND_URL}/api/exams/${examId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const fetchData = await fetchResponse.json();
            rawExamData = fetchData.data || fetchData;
          }
        }

        if (!rawExamData) {
          throw new Error("Examen non trouvé");
        }

        const normalizedExam = normalizeExam(rawExamData);

        if (normalizedExam.questions.length === 0) {
          throw new Error("Cet examen ne contient pas de questions");
        }

        sessionStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({
            exam: normalizedExam,
            timestamp: Date.now(),
          }),
        );

        setExam(normalizedExam);
        setTimeLeft(normalizedExam.duration * 60);
      } catch (err) {
        console.error("Erreur chargement examen:", err);
        setError(err.message || "Impossible de charger l'examen");
        toast.error(err.message || "Impossible de charger l'examen");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId, location.state]);

  // ============================================
  // TIMER
  // ============================================
  useEffect(() => {
    if (!exam || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, submitted]);

  // ============================================
  // GESTION DES RÉPONSES
  // ============================================
  const handleAnswerSelect = useCallback(
    (questionId, answer) => {
      if (submitted) return;

      setAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));

      sessionStorage.setItem(
        "quiz_answers",
        JSON.stringify({
          ...answers,
          [questionId]: answer,
        }),
      );
    },
    [submitted, answers],
  );

  // ============================================
  // CALCUL DU SCORE
  // ============================================
  const calculateScoreAndDetails = useCallback(() => {
    if (!exam?.questions) return { total: 0, details: [] };

    let totalPoints = 0;
    let correctCount = 0;
    const details = [];

    exam.questions.forEach((q, index) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;

      if (isCorrect) {
        totalPoints += q.points;
        correctCount++;
      }

      details.push({
        id: q.id,
        index: index + 1,
        text: q.text,
        userAnswer: userAnswer || "(Non répondue)",
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points,
        explanation: q.explanation,
      });
    });

    const percentage =
      exam.totalPoints > 0 ? (totalPoints / exam.totalPoints) * 100 : 0;

    return {
      total: totalPoints,
      correctCount,
      totalQuestions: exam.questions.length,
      totalPoints: exam.totalPoints,
      percentage,
      details,
    };
  }, [exam, answers]);

  // ============================================
  // SOUMISSION - VERSION CORRIGÉE
  // ============================================
  const handleSubmit = useCallback(async () => {
    if (submitted) return;

    const result = calculateScoreAndDetails();

    setDetailedResults(result.details);
    setScore({
      score: result.total,
      total: result.totalPoints,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      passed: result.percentage >= (exam?.passingScore || 70),
    });
    setSubmitted(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const student = studentInfo || {};

    const resultData = {
      user: user?._id || user?.id,
      userId: user?._id || user?.id,
      firstName: user?.firstName || student?.firstName || "Utilisateur",
      lastName: user?.lastName || student?.lastName || "",
      email: user?.email || "",
      quiz: exam?.id || null,
      quizId: exam?.id || null,
      quizTitle: exam?.title || "Quiz",
      domain: exam?.domain || "Général",
      subject: exam?.subject || "Général",
      level: exam?.level || "Débutant",
      score: Math.round(result.percentage),
      total: exam?.questions?.length || 0,
      totalQuestions: exam?.questions?.length || 0,
      correctAnswers: result.correctCount,
      answers: answers,
      details: result.details,
      timeSpent: exam?.duration * 60 - timeLeft,
      pointsEarned: result.total,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    try {
      const token =
        localStorage.getItem("userToken") || localStorage.getItem("token");

      const response = await fetch(`${BACKEND_URL}/api/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resultData),
      });

      const data = await response.json();

      if (response.ok) {
        const savedResult = data?.data || data;
        setResultId(savedResult?._id || savedResult?.id || null);
        toast.success("Résultats sauvegardés ! Bulletin disponible.");
      } else {
        throw new Error(data?.message || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error("Erreur sauvegarde résultat:", err);
      toast.error("Résultats sauvegardés localement.");

      const localResults = JSON.parse(
        localStorage.getItem("quiz_results_offline") || "[]",
      );
      const localId = Date.now();
      localStorage.setItem(
        "quiz_results_offline",
        JSON.stringify([
          ...localResults,
          {
            ...resultData,
            savedToCloud: false,
            localId,
            _id: `local_${localId}`,
          },
        ]),
      );
      setResultId(`local_${localId}`);
    }

    sessionStorage.removeItem(PROGRESS_KEY);
    sessionStorage.removeItem("quiz_answers");
  }, [exam, answers, timeLeft, studentInfo, submitted]);

  const handleAutoSubmit = useCallback(() => {
    console.log("⏰ Auto-submission - Temps écoulé");
    toast.warning("Temps écoulé ! Votre examen a été soumis automatiquement.");
    handleSubmit();
  }, [handleSubmit]);

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirm(false);
    handleSubmit();
  }, [handleSubmit]);

  // ============================================
  // TÉLÉCHARGEMENT DU BULLETIN - FONCTIONS DÉFINIES
  // ============================================

  const handleDownloadBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à télécharger");
      return;
    }

    // 🔒 Le téléchargement de bulletin dépend du plan d'abonnement (voir
    // document de recommandations §9.3 / SubscriptionContext.PLAN_FEATURES).
    if (!canExportBulletin()) return;

    if (typeof resultId === "string" && resultId.startsWith("local_")) {
      toast.info("Résultat local - génération du bulletin en cours...");
      generateLocalBulletin();
      recordExport();
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    const url = `${BACKEND_URL}/api/bulletin/${resultId}?token=${encodeURIComponent(token || "")}`;

    window.open(url, "_blank");
    toast.success("Téléchargement du bulletin...");
    recordExport();
  }, [resultId, canExportBulletin, recordExport]);

  // ✅ Fonction handlePrintBulletin manquante
  const handlePrintBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à imprimer");
      return;
    }

    // 🔒 Même règle que le téléchargement (voir handleDownloadBulletin).
    if (!canExportBulletin()) return;

    if (typeof resultId === "string" && resultId.startsWith("local_")) {
      toast.info("Résultat local - impression non disponible");
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    const url = `${BACKEND_URL}/api/bulletin/${resultId}?token=${encodeURIComponent(token || "")}`;

    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      toast.error("Popup bloqué. Veuillez autoriser les popups.");
    } else {
      recordExport();
    }
  }, [resultId, canExportBulletin, recordExport]);

  // ✅ Génération de bulletin local (fallback)
  const generateLocalBulletin = useCallback(() => {
    try {
      // Créer un rapport simple
      const report = `
        BULLETIN DE RÉSULTATS
        ====================
        Examen: ${exam?.title || "Quiz"}
        Score: ${score?.percentage || 0}%
        Correctes: ${score?.correctCount || 0}/${score?.totalQuestions || 0}
        Date: ${new Date().toLocaleDateString("fr-FR")}
        
        Détail des réponses:
        ${detailedResults
          .map(
            (r, i) =>
              `${i + 1}. ${r.text}\n   Réponse: ${r.userAnswer}\n   Correct: ${r.correctAnswer}\n   ${r.isCorrect ? "✅" : "❌"}`,
          )
          .join("\n\n")}
      `;

      // Télécharger en tant que fichier texte
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulletin_${exam?.title || "quiz"}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Bulletin local généré !");
    } catch (e) {
      console.error("Erreur génération bulletin local:", e);
      toast.error("Impossible de générer le bulletin");
    }
  }, [exam, score, detailedResults]);

  // ============================================
  // NAVIGATION VERS REVIEW
  // ============================================
  const handleGoToReview = useCallback(() => {
    if (!exam) return;

    const formattedUserAnswers = {};
    exam.questions.forEach((q, idx) => {
      const userAnswer = answers[q.id];
      if (
        userAnswer !== undefined &&
        userAnswer !== null &&
        userAnswer !== ""
      ) {
        formattedUserAnswers[idx] = userAnswer;
      }
    });

    navigate("/review", {
      state: {
        quizQuestions: exam.questions.map((q, idx) => ({
          id: idx,
          text: q.text,
          question: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
        })),
        userAnswers: formattedUserAnswers,
        score: score?.score || 0,
        totalQuestions: exam.questions.length,
        domaine: exam.domain,
        niveau: exam.level,
        matiere: exam.subject,
      },
    });
  }, [exam, answers, score, navigate]);

  // ============================================
  // UTILITAIRES D'AFFICHAGE
  // ============================================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 60) return "#ef4444";
    if (timeLeft < 300) return "#f59e0b";
    return "#10b981";
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = useMemo(() => {
    if (!exam) return 0;
    return (answeredCount / exam.questions.length) * 100;
  }, [exam, answeredCount]);

  const currentQ = exam?.questions[currentQuestion];

  // ============================================
  // RENDU - ÉTATS DE CHARGEMENT / ERREUR
  // ============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
      <NavHome />
        <Loader size={48} color="#6366f1" style={styles.spinner} />
        <p style={styles.loadingText}>Chargement de l'examen...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div style={styles.errorContainer}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={styles.errorTitle}>Examen non trouvé</h2>
        <p style={styles.errorText}>
          {error || "L'examen que vous recherchez n'existe pas."}
        </p>
        <button onClick={() => navigate("/exams")} style={styles.errorButton}>
          Retour aux examens
        </button>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div style={styles.container}>
      <div style={styles.backgroundGrid} />
      <div style={styles.backgroundGlow} />

      <main style={styles.main}>
        {/* En-tête */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              onClick={() => navigate("/exams")}
              style={styles.backButton}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={styles.examTitle}>{exam.title}</h1>
              <div style={styles.tags}>
                <span style={styles.tag}>{exam.domainNom || exam.domain}</span>
                <span
                  style={{
                    ...styles.tag,
                    background: "rgba(16,185,129,0.1)",
                    color: "#10b981",
                  }}
                >
                  {exam.levelNom || exam.level}
                </span>
                <span
                  style={{
                    ...styles.tag,
                    background: "rgba(245,158,11,0.1)",
                    color: "#f59e0b",
                  }}
                >
                  {exam.matiereNom || exam.subject}
                </span>
              </div>
            </div>
          </div>

          {!submitted && (
            <div style={styles.timer}>
              <Clock size={18} color={getTimeColor()} />
              <span style={{ ...styles.timerText, color: getTimeColor() }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {submitted && score && (
            <div
              style={{
                ...styles.scoreBadge,
                background: score.passed
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(239,68,68,0.1)",
                borderColor: score.passed ? "#10b981" : "#ef4444",
              }}
            >
              {score.passed ? (
                <CheckCircle size={18} color="#10b981" />
              ) : (
                <XCircle size={18} color="#ef4444" />
              )}
              <span style={{ color: score.passed ? "#10b981" : "#ef4444" }}>
                {score.score}/{score.total} pts ({score.percentage.toFixed(0)}%)
              </span>
            </div>
          )}
        </header>

        {/* Barre de progression */}
        {!submitted && (
          <div style={styles.progressContainer}>
            <div style={styles.progressLabels}>
              <span>Progression</span>
              <span>
                {answeredCount}/{exam.questions.length} questions
              </span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {!submitted ? (
          <>
            <div style={styles.questionNav}>
              <button
                onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
                disabled={currentQuestion === 0}
                style={{
                  ...styles.navButton,
                  opacity: currentQuestion === 0 ? 0.5 : 1,
                  cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span style={styles.questionCounter}>
                Question {currentQuestion + 1} / {exam.questions.length}
              </span>
              <button
                onClick={() =>
                  setCurrentQuestion((p) =>
                    Math.min(exam.questions.length - 1, p + 1),
                  )
                }
                disabled={currentQuestion === exam.questions.length - 1}
                style={{
                  ...styles.navButton,
                  opacity:
                    currentQuestion === exam.questions.length - 1 ? 0.5 : 1,
                  cursor:
                    currentQuestion === exam.questions.length - 1
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={styles.questionCard}
              >
                <div style={styles.questionHeader}>
                  <span style={styles.questionNumber}>
                    {currentQuestion + 1}
                  </span>
                  <span style={styles.questionPoints}>
                    {currentQ.points} point{currentQ.points > 1 ? "s" : ""}
                  </span>
                </div>
                <p style={styles.questionText}>{currentQ.text}</p>
                <div style={styles.optionsContainer}>
                  {currentQ.options.map((option, idx) => {
                    const isSelected = answers[currentQ.id] === option;
                    return (
                      <motion.label
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          ...styles.option,
                          background: isSelected
                            ? "rgba(99,102,241,0.15)"
                            : "rgba(255,255,255,0.02)",
                          borderColor: isSelected
                            ? "#6366f1"
                            : "rgba(99,102,241,0.2)",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQ.id}`}
                          value={option}
                          checked={isSelected}
                          onChange={() =>
                            handleAnswerSelect(currentQ.id, option)
                          }
                          style={styles.radio}
                        />
                        <span>{option}</span>
                      </motion.label>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            <div style={styles.submitContainer}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowConfirm(true)}
                style={{
                  ...styles.submitButton,
                  background:
                    answeredCount === exam.questions.length
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "linear-gradient(135deg, #f59e0b, #d97706)",
                }}
              >
                <Send size={18} />
                {answeredCount === exam.questions.length
                  ? "Soumettre l'examen"
                  : `Soumettre (${answeredCount}/${exam.questions.length})`}
              </motion.button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.resultsCard}
          >
            <div style={styles.resultsHeader}>
              <div
                style={{
                  ...styles.resultIcon,
                  background: score.passed
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                  borderColor: score.passed ? "#10b981" : "#ef4444",
                }}
              >
                {score.passed ? (
                  <CheckCircle size={40} color="#10b981" />
                ) : (
                  <XCircle size={40} color="#ef4444" />
                )}
              </div>
              <h2 style={styles.resultTitle}>
                {score.passed ? "Félicitations !" : "Très bien !"}
              </h2>
              <p style={styles.resultSubtitle}>
                {score.passed
                  ? "Vous avez réussi l'examen"
                  : "Continuez vos efforts"}
              </p>
              <div
                style={{
                  ...styles.resultScore,
                  background: score.passed
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(239,68,68,0.1)",
                  borderColor: score.passed ? "#10b981" : "#ef4444",
                }}
              >
                <Award size={18} color={score.passed ? "#10b981" : "#ef4444"} />
                <span>
                  Score: {score.percentage.toFixed(0)}% (seuil:{" "}
                  {exam.passingScore}%)
                </span>
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={{ ...styles.statCard, borderColor: "#10b981" }}>
                <div style={{ ...styles.statValue, color: "#10b981" }}>
                  {score.correctCount}
                </div>
                <div style={styles.statLabel}>Correctes</div>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#ef4444" }}>
                <div style={{ ...styles.statValue, color: "#ef4444" }}>
                  {score.totalQuestions - score.correctCount}
                </div>
                <div style={styles.statLabel}>Incorrectes</div>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#f59e0b" }}>
                <div style={{ ...styles.statValue, color: "#f59e0b" }}>
                  {Math.round(score.percentage)}%
                </div>
                <div style={styles.statLabel}>Précision</div>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#6366f1" }}>
                <div style={{ ...styles.statValue, color: "#a5b4fc" }}>
                  {score.totalQuestions - Object.keys(answers).length}
                </div>
                <div style={styles.statLabel}>Non répondues</div>
              </div>
            </div>

            {resultId && (
              <div style={styles.downloadSection}>
                <h3 style={styles.detailsTitle}>📄 Bulletin de résultats</h3>
                <div style={styles.downloadButtons}>
                  <button
                    onClick={handleDownloadBulletin}
                    style={styles.downloadButton}
                  >
                    <Download size={18} /> Télécharger le bulletin
                  </button>
                  <button
                    onClick={handlePrintBulletin}
                    style={styles.printButton}
                  >
                    <Printer size={18} /> Imprimer
                  </button>
                </div>
                <p style={styles.downloadInfo}>
                  Le bulletin officiel sera disponible au format PDF.
                </p>
              </div>
            )}

            <div style={styles.detailsSection}>
              <h3 style={styles.detailsTitle}>Détail des réponses</h3>
              {detailedResults.map((result) => (
                <div
                  key={result.id}
                  style={{
                    ...styles.detailCard,
                    background: result.isCorrect
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                    borderColor: result.isCorrect ? "#10b981" : "#ef4444",
                  }}
                >
                  <div style={styles.detailHeader}>
                    <span
                      style={{
                        ...styles.detailNumber,
                        background: result.isCorrect ? "#10b981" : "#ef4444",
                      }}
                    >
                      {result.index}
                    </span>
                    <span style={styles.detailQuestion}>{result.text}</span>
                    {result.isCorrect ? (
                      <CheckCircle size={18} color="#10b981" />
                    ) : (
                      <XCircle size={18} color="#ef4444" />
                    )}
                  </div>
                  <div style={styles.detailBody}>
                    <p style={{ color: "#10b981" }}>
                      ✓ Bonne réponse : {result.correctAnswer}
                    </p>
                    {!result.isCorrect &&
                      result.userAnswer !== "(Non répondue)" && (
                        <p style={{ color: "#ef4444" }}>
                          ✗ Votre réponse : {result.userAnswer}
                        </p>
                      )}
                    {result.userAnswer === "(Non répondue)" && (
                      <p style={{ color: "#f59e0b" }}>⚠️ Non répondue</p>
                    )}
                    {result.explanation && (
                      <p style={{ color: "#64748b" }}>
                        📖 {result.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.actionsContainer}>
              <button onClick={handleGoToReview} style={styles.secondaryButton}>
                📝 Voir les questions corrigées
              </button>
              <button
                onClick={() => navigate("/exams")}
                style={styles.primaryButton}
              >
                ← Retour aux examens
              </button>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <AlertTriangle
                size={48}
                color="#f59e0b"
                style={{ marginBottom: 16 }}
              />
              <h3>Confirmer la soumission ?</h3>
              <p>
                Vous avez répondu à {answeredCount} questions sur{" "}
                {exam.questions.length}.<br />
                Cette action est irréversible.
              </p>
              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={styles.modalCancel}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  style={styles.modalConfirm}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
    position: "relative",
    padding: "24px",
  },
  backgroundGrid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  backgroundGlow: {
    position: "fixed",
    top: "-15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "70vw",
    height: "50vh",
    background:
      "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 900,
    margin: "0 auto",
  },
  header: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    padding: 8,
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
  },
  examTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#f8fafc",
  },
  tags: {
    display: "flex",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    padding: "2px 8px",
    background: "rgba(99,102,241,0.1)",
    borderRadius: 12,
    color: "#a5b4fc",
    fontSize: "0.7rem",
  },
  timer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 12,
  },
  timerText: {
    fontSize: "1.1rem",
    fontWeight: 600,
    fontFamily: "monospace",
  },
  scoreBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    border: "1px solid",
    borderRadius: 12,
    fontWeight: 600,
  },
  progressContainer: {
    marginBottom: 16,
    padding: "0 4px",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    color: "#94a3b8",
    fontSize: "0.8rem",
  },
  progressBar: {
    width: "100%",
    height: 6,
    background: "#1e293b",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: 3,
    transition: "width 0.3s",
  },
  questionNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    color: "#94a3b8",
  },
  questionCounter: {
    color: "#94a3b8",
  },
  questionCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#6366f1",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  questionPoints: {
    padding: "4px 8px",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid #f59e0b",
    borderRadius: 12,
    color: "#f59e0b",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  questionText: {
    fontSize: "1.1rem",
    color: "#f8fafc",
    lineHeight: 1.6,
    marginBottom: 24,
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  option: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    border: "2px solid",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  radio: {
    marginRight: 12,
    accentColor: "#6366f1",
    width: 18,
    height: 18,
  },
  submitContainer: {
    textAlign: "center",
  },
  submitButton: {
    padding: "16px 48px",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontSize: "1.1rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
  },
  resultsCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 24,
    padding: 32,
  },
  resultsHeader: {
    textAlign: "center",
    marginBottom: 32,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  resultTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 8,
  },
  resultSubtitle: {
    color: "#94a3b8",
    fontSize: "1.1rem",
    marginBottom: 16,
  },
  resultScore: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 20px",
    border: "1px solid",
    borderRadius: 20,
    fontWeight: 600,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },
  statValue: {
    fontSize: "1.8rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "0.8rem",
  },
  downloadSection: {
    background: "rgba(16,185,129,0.05)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  downloadButtons: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 12,
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  printButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8,
    color: "#a5b4fc",
    cursor: "pointer",
    fontWeight: 600,
  },
  downloadInfo: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginTop: 8,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#f8fafc",
    marginBottom: 16,
  },
  detailCard: {
    border: "1px solid",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  detailNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  detailQuestion: {
    color: "#f8fafc",
    fontWeight: 500,
    flex: 1,
  },
  detailBody: {
    marginLeft: 40,
    fontSize: "0.85rem",
  },
  actionsContainer: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 24px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8,
    color: "#a5b4fc",
    cursor: "pointer",
  },
  loadingContainer: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  loadingText: {
    color: "#94a3b8",
  },
  errorContainer: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 24,
  },
  errorTitle: {
    color: "#f8fafc",
    fontSize: "1.5rem",
    marginBottom: 8,
  },
  errorText: {
    color: "#94a3b8",
    marginBottom: 24,
  },
  errorButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#0f172a",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 24,
    padding: 32,
    maxWidth: 400,
    textAlign: "center",
  },
  modalActions: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  modalCancel: {
    flex: 1,
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    color: "#94a3b8",
    cursor: "pointer",
  },
  modalConfirm: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },
};

export default QuizCompositionPage;
