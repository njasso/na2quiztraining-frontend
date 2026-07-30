// src/pages/ComposeExamPage.jsx — Page de passage d'examen (version complète avec téléchargement bulletin)
// ✅ Corrections : handleSubmit avec score = pourcentage
// ✅ Sauvegarde de progression dans sessionStorage
// ✅ Téléchargement du bulletin de résultats (PDF)
// ✅ Affichage détaillé des réponses avec explications
// ✅ Gestion des erreurs et fallback local
// ✅ CORRECTION: setShowConfirm défini
// ✅ CORRECTION: Utilisation de import.meta.env pour Vite
// ✅ CORRECTION: Route bulletin avec 's'
// ✅ CORRECTION: Modale de confirmation ajoutée

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  XCircle,
  Award,
  BookOpen,
  Layers,
  Send,
  Loader2,
  FileText,
  Download,
  User,
  Calendar,
  Trophy,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveResult } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

import NavHome from '../components/NavHome';
// ============================================
// CONSTANTES
// ============================================
const PROGRESS_KEY = "compose_exam_progress";
// ✅ CORRECTION: Utiliser import.meta.env pour Vite
const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:5000";

const ComposeExamPage = () => {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef();

  // États
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timerActive, setTimerActive] = useState(true);
  const [logoBase64, setLogoBase64] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [resultId, setResultId] = useState(null);
  const [score, setScore] = useState(null);
  const [detailedResults, setDetailedResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  // ✅ CORRECTION: Ajout du state manquant
  const [showConfirm, setShowConfirm] = useState(false);

  // ============================================
  // CHARGEMENT DU LOGO
  // ============================================
  const convertImageToBase64 = useCallback((url) => {
    return new Promise((resolve, reject) => {
      if (url.startsWith("data:")) {
        resolve(url);
        return;
      }

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
    });
  }, []);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const base64 = await convertImageToBase64(logo);
        setLogoBase64(base64);
      } catch (error) {
        console.error("Logo conversion error:", error);
      }
    };
    loadLogo();
  }, [convertImageToBase64]);

  // ============================================
  // CHARGEMENT DE L'EXAMEN
  // ============================================
  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);

        // Récupérer les infos étudiant
        try {
          const stored = localStorage.getItem("studentInfoForExam");
          if (stored) {
            const parsed = JSON.parse(stored);
            setStudentInfo(parsed.info || parsed);
          }
        } catch (e) {
          console.warn("Erreur récupération infos étudiant:", e);
        }

        const examData = location.state?.exam || (await fetchExamById(examId));

        const normalizedQuestions = examData.questions.map((question) => ({
          ...question,
          id: question.id || Math.random().toString(36).substr(2, 9),
          text: question.text || question.question || "Question sans texte",
          options: question.options.map((option, index) => ({
            id: index,
            text:
              typeof option === "string"
                ? option
                : option.text || option.optionText || "Option sans texte",
            isCorrect:
              typeof option === "string"
                ? question.correctAnswers?.includes(index) || false
                : option.isCorrect || false,
          })),
          explanation: question.explanation || "",
        }));

        const normalizedExam = {
          ...examData,
          questions: normalizedQuestions,
        };

        setExam(normalizedExam);

        const durationSec = examData.duration
          ? examData.duration * 60
          : normalizedQuestions.length * 60;
        setTimeLeft(durationSec);

        // Sauvegarder en sessionStorage
        sessionStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({
            exam: normalizedExam,
            timestamp: Date.now(),
          }),
        );
      } catch (err) {
        console.error("Exam loading error:", err);
        toast.error("Erreur lors du chargement de l'examen");
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId, location.state]);

  // ============================================
  // TIMER - CORRIGÉ AVEC CLEANUP
  // ============================================
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || submitted) return;

    const timerId = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerId);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerActive, timeLeft, submitted]);

  // ============================================
  // GESTION DES RÉPONSES
  // ============================================
  const handleAnswerSelect = (qIndex, optIndex) => {
    if (submitted) return;

    setUserAnswers((prev) => {
      const newAnswers = { ...prev };
      const question = exam.questions[qIndex];

      if (question.questionType === "single") {
        newAnswers[qIndex] = [optIndex];
      } else {
        const current = prev[qIndex] || [];
        newAnswers[qIndex] = current.includes(optIndex)
          ? current.filter((i) => i !== optIndex)
          : [...current, optIndex];
      }
      return newAnswers;
    });

    // Sauvegarder les réponses
    sessionStorage.setItem(
      "compose_answers",
      JSON.stringify({
        ...userAnswers,
        [qIndex]: [optIndex],
      }),
    );
  };

  // ============================================
  // CALCUL DU SCORE
  // ============================================
  const calculateScoreAndDetails = useCallback(() => {
    if (!exam) return { score: 0, details: [], correctCount: 0 };

    let totalPoints = 0;
    let correctCount = 0;
    const details = [];

    exam.questions.forEach((q, idx) => {
      const correctIndexes = q.options
        .map((o, i) => (o.isCorrect ? i : -1))
        .filter((i) => i !== -1);
      const user = userAnswers[idx] || [];

      const isCorrect =
        q.questionType === "single"
          ? user.length === 1 && correctIndexes.includes(user[0])
          : user.length === correctIndexes.length &&
            [...user].sort().join() === [...correctIndexes].sort().join();

      if (isCorrect) {
        totalPoints += q.points || 1;
        correctCount++;
      }

      details.push({
        id: q.id,
        index: idx + 1,
        text: q.text,
        userAnswer:
          user.length > 0
            ? user
                .map((i) => q.options[i]?.text || `Option ${i + 1}`)
                .join(", ")
            : "(Non répondue)",
        correctAnswer: correctIndexes
          .map((i) => q.options[i]?.text || `Option ${i + 1}`)
          .join(", "),
        isCorrect,
        points: q.points || 1,
        explanation: q.explanation || "",
        options: q.options,
      });
    });

    const total = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = total > 0 ? Math.round((totalPoints / total) * 100) : 0;

    return {
      score: totalPoints,
      total: total,
      correctCount,
      totalQuestions: exam.questions.length,
      percentage,
      details,
      passed: percentage >= 70,
    };
  }, [exam, userAnswers]);

  // ============================================
  // SOUMISSION - CORRIGÉE AVEC MODALE
  // ============================================
  const handleSubmit = useCallback(async () => {
    if (submitted || isSubmitting) return;

    // ✅ Fermer la modale
    setShowConfirm(false);
    setIsSubmitting(true);
    setTimerActive(false);

    const result = calculateScoreAndDetails();
    setScore(result);
    setDetailedResults(result.details);
    setSubmitted(true);

    // ✅ Sauvegarder le résultat pour le bulletin
    try {
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
        score: result.percentage,
        total: exam?.questions?.length || 0,
        totalQuestions: exam?.questions?.length || 0,
        correctAnswers: result.correctCount,
        answers: userAnswers,
        details: result.details,
        timeSpent: exam?.duration * 60 - timeLeft,
        pointsEarned: result.score,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      // ✅ Utiliser fetch avec le token
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

      // Fallback local
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

    // Nettoyer la progression
    sessionStorage.removeItem(PROGRESS_KEY);
    sessionStorage.removeItem("compose_answers");
    setIsSubmitting(false);
  }, [submitted, isSubmitting, exam, user, userAnswers, timeLeft, studentInfo]);

  // ============================================
  // TÉLÉCHARGEMENT DU BULLETIN - CORRIGÉ
  // ============================================
  const handleDownloadBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à télécharger");
      return;
    }

    // ✅ Pour les IDs locaux
    if (typeof resultId === "string" && resultId.startsWith("local_")) {
      toast.info("Résultat local - génération du bulletin en cours...");
      generateLocalBulletin();
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    // ✅ CORRECTION: Route avec 's'
    const url = `${BACKEND_URL}/api/bulletins/${resultId}?token=${encodeURIComponent(token || "")}`;

    window.open(url, "_blank");
    toast.success("Téléchargement du bulletin...");
  }, [resultId]);

  const handlePrintBulletin = useCallback(() => {
    if (!resultId) {
      toast.error("Aucun résultat à imprimer");
      return;
    }

    if (typeof resultId === "string" && resultId.startsWith("local_")) {
      toast.info("Résultat local - impression non disponible");
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    // ✅ CORRECTION: Route avec 's'
    const url = `${BACKEND_URL}/api/bulletins/${resultId}?token=${encodeURIComponent(token || "")}`;

    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      toast.error("Popup bloqué. Veuillez autoriser les popups.");
    }
  }, [resultId]);

  // ✅ Génération de bulletin local (fallback)
  const generateLocalBulletin = useCallback(() => {
    try {
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
  // EXPORT PDF (jsPDF)
  // ============================================
  const handleExportPDF = async () => {
    if (!exam || !score) return;
    setExportingPDF(true);

    try {
      const doc = new jsPDF();
      const margin = 15;
      let y = 15;

      // Logo
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", margin, y, 30, 30);
          y += 40;
        } catch (err) {
          console.error("Error adding logo:", err);
          y += 10;
        }
      }

      // Header
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text("BULLETIN DE RÉSULTATS", 105, y, { align: "center" });
      y += 15;

      // Exam info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);

      const studentName =
        `${user?.firstName || studentInfo?.firstName || ""} ${user?.lastName || studentInfo?.lastName || ""}`.trim() ||
        "Étudiant";

      const examInfo = [
        { label: "Étudiant", value: studentName },
        { label: "Examen", value: exam.title },
        { label: "Matière", value: exam.subject || "Non spécifié" },
        { label: "Niveau", value: exam.level || "Non spécifié" },
        { label: "Domaine", value: exam.domain || "Non spécifié" },
        { label: "Date", value: new Date().toLocaleDateString("fr-FR") },
      ];

      examInfo.forEach((info, i) => {
        doc.setTextColor(100);
        doc.text(`${info.label}:`, margin, y + i * 7);
        doc.setTextColor(0);
        doc.text(info.value, margin + 40, y + i * 7);
      });

      y += examInfo.length * 7 + 15;

      // Results summary
      const passed = score.percentage >= 70;

      doc.setFontSize(16);
      doc.setTextColor(passed ? 16 : 239, passed ? 185 : 68, passed ? 129 : 68);
      doc.setFont("helvetica", "bold");
      doc.text(passed ? "✓ RÉUSSITE" : "✗ ÉCHEC", 105, y, { align: "center" });
      y += 10;

      doc.autoTable({
        startY: y,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Score obtenu", `${score.score} / ${score.total}`],
          ["Pourcentage", `${score.percentage}%`],
          ["Seuil de réussite", "70%"],
          [
            "Bonnes réponses",
            `${score.correctCount} / ${score.totalQuestions}`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { cellPadding: 5, fontSize: 11 },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 15;

      // Detailed results
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text("DÉTAIL DES RÉPONSES", 105, y, { align: "center" });
      y += 10;

      const detailRows = detailedResults.map((d) => [
        `Q${d.index}`,
        d.text.substring(0, 40) + (d.text.length > 40 ? "..." : ""),
        d.isCorrect ? "✓" : "✗",
        d.userAnswer || "Non répondu",
        d.correctAnswer,
      ]);

      doc.autoTable({
        startY: y,
        head: [["Q", "Question", "Status", "Votre réponse", "Bonne réponse"]],
        body: detailRows,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { cellPadding: 4, fontSize: 8 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 80 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
        },
      });

      const safeTitle = exam.title.replace(/[^a-zA-Z0-9_]/g, "_");
      doc.save(
        `Bulletin_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success("PDF généré avec succès !");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const fetchExamById = async (id) => {
    // Simuler un appel API
    return {
      id,
      title: "Examen de Mathématiques",
      subject: "Mathématiques",
      level: "Terminale",
      domain: "Algèbre",
      duration: 30,
      questions: [
        {
          id: 1,
          text: "Quelle est la dérivée de x² ?",
          points: 2,
          questionType: "single",
          explanation: "La dérivée de x² est 2x.",
          options: [
            { id: 0, text: "2x", isCorrect: true },
            { id: 1, text: "x", isCorrect: false },
            { id: 2, text: "x²", isCorrect: false },
          ],
        },
        {
          id: 2,
          text: "Quels sont les nombres premiers ?",
          points: 3,
          questionType: "multiple",
          explanation: "2 et 3 sont des nombres premiers.",
          options: [
            { id: 0, text: "2", isCorrect: true },
            { id: 1, text: "4", isCorrect: false },
            { id: 2, text: "3", isCorrect: true },
            { id: 3, text: "6", isCorrect: false },
          ],
        },
        {
          id: 3,
          text: "Résoudre l'équation : 2x + 5 = 15",
          points: 2,
          questionType: "single",
          explanation: "2x = 10 donc x = 5.",
          options: [
            { id: 0, text: "x = 5", isCorrect: true },
            { id: 1, text: "x = 10", isCorrect: false },
            { id: 2, text: "x = 7.5", isCorrect: false },
            { id: 3, text: "x = 20", isCorrect: false },
          ],
        },
      ],
    };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 60) return "#ef4444";
    if (timeLeft < 300) return "#f59e0b";
    return "#10b981";
  };

  // ============================================
  // RENDU - ÉTATS DE CHARGEMENT / ERREUR
  // ============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
      <NavHome />
        <Loader2 size={48} className="animate-spin" color="#6366f1" />
        <p style={styles.loadingText}>Chargement de l'examen...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!exam) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={styles.errorTitle}>Examen non trouvé</h2>
        <p style={styles.errorText}>
          L'examen que vous recherchez n'existe pas ou a été supprimé.
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

      <main style={styles.main} ref={printRef}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={styles.backButton}
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div>
              <h1 style={styles.examTitle}>{exam.title}</h1>
              <div style={styles.tags}>
                <span style={styles.tag}>{exam.subject}</span>
                <span
                  style={{
                    ...styles.tag,
                    background: "rgba(139,92,246,0.1)",
                    color: "#c4b5fd",
                  }}
                >
                  {exam.level}
                </span>
                <span
                  style={{
                    ...styles.tag,
                    background: "rgba(16,185,129,0.1)",
                    color: "#6ee7b7",
                  }}
                >
                  {exam.domain}
                </span>
              </div>
            </div>
          </div>

          {!submitted && (
            <div style={styles.timer}>
              <Clock size={20} color={getTimerColor()} />
              <span style={{ ...styles.timerText, color: getTimerColor() }}>
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
                {score.percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {!submitted && (
          <div style={styles.progressContainer}>
            <div style={styles.progressLabels}>
              <span>Progression</span>
              <span>
                {Object.keys(userAnswers).length}/{exam.questions.length}{" "}
                questions
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(Object.keys(userAnswers).length / exam.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        {!submitted ? (
          <div style={styles.questionsContainer}>
            {exam.questions.map((question, qIndex) => {
              const isAnswered = userAnswers[qIndex]?.length > 0;

              return (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.05 }}
                  style={{
                    ...styles.questionCard,
                    borderColor: isAnswered
                      ? "#6366f1"
                      : "rgba(99,102,241,0.2)",
                  }}
                >
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNumber}>{qIndex + 1}</span>
                    <div style={{ flex: 1 }}>
                      <p style={styles.questionText}>{question.text}</p>
                      <p style={styles.questionPoints}>
                        {question.points} point{question.points > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div style={styles.optionsContainer}>
                    {question.options.map((option, optIndex) => {
                      const userSelected = (userAnswers[qIndex] || []).includes(
                        optIndex,
                      );

                      return (
                        <label
                          key={optIndex}
                          style={{
                            ...styles.option,
                            background: userSelected
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(255,255,255,0.02)",
                            borderColor: userSelected
                              ? "#6366f1"
                              : "rgba(99,102,241,0.2)",
                          }}
                        >
                          <input
                            type={
                              question.questionType === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            checked={userSelected}
                            onChange={() =>
                              handleAnswerSelect(qIndex, optIndex)
                            }
                            style={styles.radio}
                          />
                          <span
                            style={{
                              color: userSelected ? "#a5b4fc" : "#94a3b8",
                            }}
                          >
                            {option.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            {/* Bouton Soumettre - CORRIGÉ avec setShowConfirm */}
            <div style={styles.submitContainer}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowConfirm(true)}
                style={styles.submitButton}
              >
                <Send size={18} />
                Soumettre l'examen
              </motion.button>
            </div>
          </div>
        ) : (
          /* ✅ Résultats avec téléchargement du bulletin */
          <div style={styles.resultsCard}>
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
                {score.passed ? "Félicitations !" : "Examen terminé"}
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
                <Trophy
                  size={18}
                  color={score.passed ? "#10b981" : "#ef4444"}
                />
                <span>Score: {score.percentage}% (seuil: 70%)</span>
              </div>
            </div>

            {/* Statistiques */}
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
                  {score.percentage}%
                </div>
                <div style={styles.statLabel}>Précision</div>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#6366f1" }}>
                <div style={{ ...styles.statValue, color: "#a5b4fc" }}>
                  {score.totalQuestions - Object.keys(userAnswers).length}
                </div>
                <div style={styles.statLabel}>Non répondues</div>
              </div>
            </div>

            {/* ✅ Actions de téléchargement */}
            {resultId && (
              <div style={styles.downloadSection}>
                <h3 style={styles.detailsTitle}>
                  📄 Bulletin de résultats officiel
                </h3>
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
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF}
                    style={{
                      ...styles.downloadButton,
                      background: exportingPDF
                        ? "rgba(16,185,129,0.3)"
                        : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                    }}
                  >
                    {exportingPDF ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <FileText size={18} />
                    )}
                    {exportingPDF ? "Génération..." : "Exporter PDF"}
                  </button>
                </div>
                <p style={styles.downloadInfo}>
                  Le bulletin officiel sera disponible au format PDF.
                </p>
              </div>
            )}

            {/* Détail des réponses */}
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

            {/* Actions */}
            <div style={styles.actionsContainer}>
              <button
                onClick={() => navigate("/exams")}
                style={styles.primaryButton}
              >
                ← Retour aux examens
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ✅ MODALE DE CONFIRMATION AJOUTÉE */}
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
              <AlertCircle
                size={48}
                color="#f59e0b"
                style={{ marginBottom: 16 }}
              />
              <h3 style={styles.modalTitle}>Confirmer la soumission ?</h3>
              <p style={styles.modalText}>
                Vous avez répondu à {Object.keys(userAnswers).length} questions
                sur {exam?.questions?.length || 0}.<br />
                Cette action est irréversible.
              </p>
              <div style={styles.modalActions}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={styles.modalCancel}
                >
                  Annuler
                </button>
                <button onClick={handleSubmit} style={styles.modalConfirm}>
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    maxWidth: 1000,
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
    gap: 16,
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
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 4,
  },
  tags: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
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
    fontSize: "1.2rem",
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
  questionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 24,
  },
  questionCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderRadius: 16,
    padding: 20,
  },
  questionHeader: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#6366f1",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginRight: 12,
    flexShrink: 0,
  },
  questionText: {
    color: "#f8fafc",
    fontWeight: 500,
    marginBottom: 4,
  },
  questionPoints: {
    color: "#94a3b8",
    fontSize: "0.8rem",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  option: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    border: "1px solid",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  radio: {
    marginRight: 12,
    accentColor: "#6366f1",
    width: 16,
    height: 16,
  },
  submitContainer: {
    textAlign: "center",
  },
  submitButton: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(99,102,241,0.3)",
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
  loadingContainer: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: "1rem",
    marginTop: 16,
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
  // ✅ STYLES DE LA MODALE AJOUTÉS
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
  modalTitle: {
    color: "#f8fafc",
    fontSize: "1.2rem",
    fontWeight: 600,
    marginBottom: 8,
  },
  modalText: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    lineHeight: 1.6,
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

export default ComposeExamPage;
