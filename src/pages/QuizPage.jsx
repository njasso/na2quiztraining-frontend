// src/pages/QuizPage.jsx — VERSION CORRIGÉE POUR VITE
// ✅ Correction : Utilisation de import.meta.env UNIQUEMENT

import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  Loader,
  RotateCcw,
  Save,
  BookOpen,
  Download,
  Printer,
  FileText,
  Award,
  User,
  Calendar,
} from "lucide-react";
import { saveResult } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

// ── Constantes ────────────────────────────────────────────────
const PROGRESS_KEY = "quiz_progress";

// ✅ Correction : Utiliser UNIQUEMENT import.meta.env pour Vite
// NE PAS utiliser process.env dans le navigateur
const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:5000";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Récupérer les données : location.state OU sessionStorage ──
  const getInitialData = () => {
    if (location.state?.quizQuestions?.length > 0) {
      sessionStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
          quizQuestions: location.state.quizQuestions,
          quizId: location.state.quizId,
          domaine: location.state.domaine,
          domaineNom: location.state.domaineNom,
          niveau: location.state.niveau,
          niveauNom: location.state.niveauNom,
          matiere: location.state.matiere,
          matiereNom: location.state.matiereNom,
          duration: location.state.duration,
          userInfo: location.state.userInfo,
        }),
      );
      return location.state;
    }
    const saved = sessionStorage.getItem(PROGRESS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  };

  const initialData = getInitialData();
  const {
    quizQuestions = [],
    quizId,
    domaine = "",
    domaineNom = "",
    niveau = "",
    niveauNom = "",
    matiere = "",
    matiereNom = "",
    duration = 300,
    userInfo = {},
  } = initialData;

  const [questions, setQuestions] = useState(quizQuestions);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [details, setDetails] = useState([]);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [resultId, setResultId] = useState(null);

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (score !== null || timeLeft <= 0 || !questions.length) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [score, questions.length]); // eslint-disable-line

  // ── Calcul score ────────────────────────────────────────────
  const calculateScore = useCallback(() => {
    let correctCount = 0;
    const det = questions.map((q, idx) => {
      const correctAnswer = q.correctAnswer || q.answer;
      const userAnswer = userAnswers[idx];
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q._id || q.id,
        question: q.text || q.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        points: isCorrect ? q.points || 1 : 0,
        explanation: q.explanation || "",
      };
    });
    return { correctCount, details: det };
  }, [questions, userAnswers]);

  // ── Télécharger le bulletin ──────────────────────────────────
  const handleDownloadBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à télécharger");
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    const url = `${BACKEND_URL}/api/bulletin/${resultId}?token=${encodeURIComponent(token || "")}`;

    window.open(url, "_blank");
    toast.success("Téléchargement du bulletin...");
  }, [resultId]);

  const handlePrintBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à imprimer");
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    const url = `${BACKEND_URL}/api/bulletin/${resultId}?token=${encodeURIComponent(token || "")}`;

    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      toast.error("Popup bloqué. Veuillez autoriser les popups.");
    }
  }, [resultId]);

  // ── Soumission ──────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || score !== null) return;
    setIsSubmitting(true);

    const { correctCount, details: det } = calculateScore();
    const scorePercent =
      questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;
    const timeSpent = duration - timeLeft;
    const pointsEarned = det.reduce((s, d) => s + d.points, 0);

    const studentName =
      `${userInfo?.firstName || user?.firstName || ""} ${userInfo?.lastName || user?.lastName || ""}`.trim() ||
      "Utilisateur";

    const resultData = {
      user: user?._id || user?.id,
      userId: user?._id || user?.id,
      firstName: user?.firstName || userInfo?.firstName || "Utilisateur",
      lastName: user?.lastName || userInfo?.lastName || "",
      email: user?.email || "",
      quiz: quizId || null,
      quizId: quizId || null,
      quizTitle: matiereNom || matiere || domaineNom || domaine || "Quiz",
      domain: domaineNom || domaine || "Général",
      subject: matiereNom || matiere || "Général",
      level: niveauNom || niveau || "Débutant",
      score: scorePercent,
      total: questions.length,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      answers: userAnswers,
      details: det,
      timeSpent,
      pointsEarned,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    try {
      const response = await saveResult(resultData);
      const savedResult = response?.data?.data || response?.data;
      setResultId(savedResult?._id || savedResult?.id || null);
      toast.success("Résultats sauvegardés !");
    } catch (err) {
      console.error("Erreur sauvegarde résultat:", err);
      toast.error("Résultats non sauvegardés — mode hors-ligne");
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
    } finally {
      sessionStorage.removeItem(PROGRESS_KEY);
      setScore(correctCount);
      setDetails(det);
      setShowResults(true);
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    score,
    calculateScore,
    questions.length,
    duration,
    timeLeft,
    user,
    quizId,
    matiere,
    matiereNom,
    domaine,
    domaineNom,
    niveau,
    niveauNom,
    userInfo,
    userAnswers,
  ]);

  // ── Helpers ─────────────────────────────────────────────────
  const handleAnswerChange = (idx, answer) => {
    if (score !== null) return;
    setUserAnswers((prev) => ({ ...prev, [idx]: answer }));
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getAppreciation = (pct) => {
    if (pct >= 90)
      return { text: "Excellent !", color: "#10b981", emoji: "🏆" };
    if (pct >= 75)
      return { text: "Très bien !", color: "#3b82f6", emoji: "🌟" };
    if (pct >= 60) return { text: "Bien !", color: "#8b5cf6", emoji: "👍" };
    if (pct >= 40) return { text: "Passable", color: "#f59e0b", emoji: "📚" };
    return { text: "À améliorer", color: "#ef4444", emoji: "💪" };
  };

  // ── Écran vide ──────────────────────────────────────────────
  if (loading)
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <Loader
            size={48}
            style={{ animation: "spin 1s linear infinite" }}
            color="#6366f1"
          />
          <p style={{ color: "#94a3b8", marginTop: 16 }}>
            Chargement du quiz...
          </p>
        </div>
      </div>
    );

  if (!questions.length)
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <AlertTriangle size={48} color="#f59e0b" />
          <h2 style={{ color: "#f8fafc", fontSize: "1.5rem", marginTop: 16 }}>
            Aucune question
          </h2>
          <p style={{ color: "#94a3b8", marginTop: 8 }}>
            Ce quiz ne contient aucune question ou la session a expiré.
          </p>
          <button onClick={() => navigate("/quizzes")} style={btnPrimaryStyle}>
            Retour aux quiz
          </button>
        </div>
      </div>
    );

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(userAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const scorePercent =
    score !== null ? Math.round((score / questions.length) * 100) : null;

  const studentName =
    `${userInfo?.firstName || user?.firstName || ""} ${userInfo?.lastName || user?.lastName || ""}`.trim() ||
    "Étudiant";
  const levelDisplay = niveauNom || niveau || "Niveau non spécifié";
  const subjectDisplay = matiereNom || matiere || "Matière non spécifiée";

  return (
    <div style={containerStyle}>
      <div style={gridBgStyle} />
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  color: "#f8fafc",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                {domaineNom || domaine || "Quiz"} ·{" "}
                {niveauNom || niveau || "Tous niveaux"} ·{" "}
                {matiereNom || matiere || "Général"}
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {studentName} · {levelDisplay}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {score === null ? (
                <>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Clock
                      size={18}
                      color={timeLeft < 60 ? "#ef4444" : "#6366f1"}
                    />
                    <span
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: timeLeft < 60 ? "#ef4444" : "#f8fafc",
                      }}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <span
                    style={{
                      color: allAnswered ? "#10b981" : "#a5b4fc",
                      fontSize: "0.9rem",
                    }}
                  >
                    {answeredCount}/{questions.length} {allAnswered ? "✓" : ""}
                  </span>
                </>
              ) : (
                <span
                  style={{
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  Score : {scorePercent}%
                </span>
              )}
            </div>
          </div>
          {score === null && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  width: "100%",
                  height: 5,
                  background: "#1e293b",
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Zone principale */}
        <AnimatePresence mode="wait">
          {/* ── Résultats ── */}
          {showResults && !showReview ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ ...cardStyle, textAlign: "center" }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(16,185,129,0.1)",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <CheckCircle size={40} color="#10b981" />
              </div>
              {(() => {
                const a = getAppreciation(scorePercent);
                return (
                  <>
                    <h2
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        marginBottom: 8,
                      }}
                    >
                      Quiz terminé !
                    </h2>
                    <p
                      style={{
                        fontSize: "1.2rem",
                        color: a.color,
                        fontWeight: 600,
                      }}
                    >
                      {a.emoji} {a.text}
                    </p>
                  </>
                );
              })()}

              {/* Informations étudiant */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginTop: 16,
                  padding: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: "1px solid rgba(99,102,241,0.1)",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Étudiant
                  </div>
                  <div
                    style={{
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {studentName}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Niveau
                  </div>
                  <div
                    style={{
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {levelDisplay}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Matière
                  </div>
                  <div
                    style={{
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {subjectDisplay}
                  </div>
                </div>
              </div>

              {/* Métriques */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  margin: "24px 0",
                }}
              >
                {[
                  { label: "Bonnes réponses", value: score, color: "#10b981" },
                  {
                    label: "Mauvaises",
                    value: questions.length - score,
                    color: "#ef4444",
                  },
                  {
                    label: "Score",
                    value: `${scorePercent}%`,
                    color: "#a5b4fc",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 12,
                      padding: 16,
                      border: "1px solid rgba(99,102,241,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        color: m.color,
                      }}
                    >
                      {m.value}
                    </div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginTop: 4,
                      }}
                    >
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.85rem",
                  marginBottom: 24,
                }}
              >
                Temps : {formatTime(duration - timeLeft)} · Sauvegardé ✓
              </p>

              {/* Actions avec téléchargement du bulletin */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setShowReview(true)}
                  style={btnSecondaryStyle}
                >
                  <BookOpen size={16} /> Revoir les réponses
                </button>

                {resultId && (
                  <>
                    <button
                      onClick={handleDownloadBulletin}
                      style={{
                        ...btnPrimaryStyle,
                        background: "linear-gradient(135deg, #10b981, #059669)",
                      }}
                    >
                      <Download size={16} /> Télécharger bulletin
                    </button>
                    <button
                      onClick={handlePrintBulletin}
                      style={{
                        ...btnSecondaryStyle,
                        borderColor: "rgba(16,185,129,0.3)",
                        color: "#10b981",
                      }}
                    >
                      <Printer size={16} /> Imprimer
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate("/quizzes")}
                  style={{
                    ...btnSecondaryStyle,
                    borderColor: "rgba(99,102,241,0.3)",
                  }}
                >
                  <ArrowLeft size={16} /> Retour aux quiz
                </button>
              </div>

              {!resultId && (
                <p
                  style={{
                    color: "#f59e0b",
                    fontSize: "0.8rem",
                    marginTop: 12,
                  }}
                >
                  ⚠️ Le bulletin n'est pas disponible (résultat non sauvegardé
                  sur le serveur)
                </p>
              )}
            </motion.div>
          ) : /* ── Revue détaillée ── */
          showReview ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <button
                  onClick={() => setShowReview(false)}
                  style={btnSecondaryStyle}
                >
                  <ArrowLeft size={16} /> Retour au résumé
                </button>

                {resultId && (
                  <button
                    onClick={handleDownloadBulletin}
                    style={{
                      ...btnSecondaryStyle,
                      borderColor: "rgba(16,185,129,0.3)",
                      color: "#10b981",
                    }}
                  >
                    <Download size={16} /> Télécharger bulletin
                  </button>
                )}
              </div>

              {details.map((d, i) => (
                <div
                  key={i}
                  style={{
                    ...cardStyle,
                    marginBottom: 12,
                    borderColor: d.isCorrect
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(239,68,68,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {d.isCorrect ? (
                      <CheckCircle size={16} color="#10b981" />
                    ) : (
                      <XCircle size={16} color="#ef4444" />
                    )}
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Question {i + 1}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#f8fafc",
                      fontSize: "0.95rem",
                      marginBottom: 10,
                    }}
                  >
                    {d.question}
                  </p>
                  {!d.isCorrect && (
                    <p
                      style={{
                        color: "#ef4444",
                        fontSize: "0.85rem",
                        marginBottom: 4,
                      }}
                    >
                      Votre réponse : {d.userAnswer || "(non répondu)"}
                    </p>
                  )}
                  <p
                    style={{
                      color: "#10b981",
                      fontSize: "0.85rem",
                      marginBottom: d.explanation ? 8 : 0,
                    }}
                  >
                    Bonne réponse : {d.correctAnswer}
                  </p>
                  {d.explanation && (
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.8rem",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      💡 {d.explanation}
                    </p>
                  )}
                </div>
              ))}
            </motion.div>
          ) : (
            /* ── Quiz actif ── */
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      background: "#6366f1",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    {currentQuestion + 1}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                    sur {questions.length}
                  </span>
                </div>

                <h3
                  style={{
                    color: "#f8fafc",
                    fontSize: "1.1rem",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  {currentQ?.text ||
                    currentQ?.question ||
                    "Question sans texte"}
                </h3>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {currentQ?.options?.map((option, idx) => {
                    const isSelected = userAnswers[currentQuestion] === option;
                    return (
                      <motion.label
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "14px 16px",
                          background: isSelected
                            ? "rgba(99,102,241,0.15)"
                            : "rgba(255,255,255,0.02)",
                          border: `2px solid ${isSelected ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion}`}
                          value={option}
                          checked={isSelected}
                          onChange={() =>
                            handleAnswerChange(currentQuestion, option)
                          }
                          style={{
                            marginRight: 12,
                            accentColor: "#6366f1",
                            width: 16,
                            height: 16,
                          }}
                        />
                        <span style={{ color: "#f8fafc", fontSize: "0.95rem" }}>
                          {option}
                        </span>
                      </motion.label>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 24,
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentQuestion((p) => Math.max(0, p - 1))
                    }
                    disabled={currentQuestion === 0}
                    style={btnSecondaryStyle}
                  >
                    <ArrowLeft size={16} /> Précédent
                  </button>

                  {currentQuestion === questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      style={{
                        ...btnPrimaryStyle,
                        background: "linear-gradient(135deg,#10b981,#059669)",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />{" "}
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Terminer
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setCurrentQuestion((p) =>
                          Math.min(questions.length - 1, p + 1),
                        )
                      }
                      style={btnPrimaryStyle}
                    >
                      Suivant <ArrowRight size={16} />
                    </button>
                  )}
                </div>

                {!allAnswered && currentQuestion === questions.length - 1 && (
                  <p
                    style={{
                      color: "#f59e0b",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    ⚠️ {questions.length - answeredCount} question(s) sans
                    réponse
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
  padding: "24px",
};
const gridBgStyle = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0,
  backgroundImage:
    "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
};
const cardStyle = {
  background: "rgba(15,23,42,0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 20,
  padding: "24px 28px",
  marginBottom: 20,
  position: "relative",
};
const btnPrimaryStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 22px",
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  border: "none",
  borderRadius: 10,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};
const btnSecondaryStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 22px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(99,102,241,0.25)",
  borderRadius: 10,
  color: "#a5b4fc",
  cursor: "pointer",
  fontSize: "0.9rem",
};

export default QuizPage;
