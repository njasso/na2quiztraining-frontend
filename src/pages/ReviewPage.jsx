// src/pages/ReviewPage.jsx - Version complète avec téléchargement bulletin
// ✅ Corrections : Calcul des statistiques correct
// ✅ Téléchargement du bulletin de résultats (PDF)
// ✅ Export PDF avec jsPDF et html2canvas
// ✅ Affichage détaillé des réponses avec explications
// ✅ Gestion des erreurs

import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  BookOpen,
  Award,
  Clock,
  Home,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const ReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const {
    quizQuestions = [],
    userAnswers = {},
    score = 0,
    userInfo = {},
    domaine,
    domaineNom,
    niveau,
    niveauNom,
    matiere,
    matiereNom,
    duration,
    totalQuestions: totalQuestionsProp,
  } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showExplanations, setShowExplanations] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { firstName = "Utilisateur", lastName = "" } = userInfo;
  const totalQuestions = totalQuestionsProp || quizQuestions.length || 0;

  // ✅ Calcul correct des statistiques
  const calculateStats = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    quizQuestions.forEach((_, index) => {
      const userAnswer = userAnswers[index];
      const correctAnswer = quizQuestions[index]?.correctAnswer;

      if (
        userAnswer === undefined ||
        userAnswer === null ||
        userAnswer === ""
      ) {
        unanswered++;
      } else if (userAnswer === correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return { correct, incorrect, unanswered };
  };

  const { correct, incorrect, unanswered } = calculateStats();
  const percentage =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const passed = percentage >= 70;

  const getAnswerStatus = (questionIndex) => {
    const userAnswer = userAnswers[questionIndex];
    const correctAnswer = quizQuestions[questionIndex]?.correctAnswer;
    const isAnswered =
      userAnswer !== undefined && userAnswer !== null && userAnswer !== "";

    return {
      isCorrect: userAnswer === correctAnswer,
      isAnswered: isAnswered,
      userAnswer: isAnswered ? userAnswer : "Non répondu",
      correctAnswer: correctAnswer,
    };
  };

  const getAppreciation = () => {
    if (percentage >= 90)
      return { text: "Excellent !", color: "#10b981", icon: "🏆" };
    if (percentage >= 75)
      return { text: "Très bien !", color: "#3b82f6", icon: "⭐" };
    if (percentage >= 60)
      return { text: "Bien !", color: "#8b5cf6", icon: "👍" };
    if (percentage >= 40)
      return { text: "Passable", color: "#f59e0b", icon: "📚" };
    return { text: "À améliorer", color: "#ef4444", icon: "💪" };
  };

  // ── Télécharger le bulletin PDF (version officielle via API) ──
  const handleDownloadBulletin = () => {
    const resultId = location.state?.resultId;
    if (!resultId) {
      toast.error("Aucun bulletin disponible");
      return;
    }

    const token =
      localStorage.getItem("userToken") || localStorage.getItem("token");
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    const url = `${backendUrl}/api/bulletin/${resultId}?token=${encodeURIComponent(token || "")}`;

    window.open(url, "_blank");
    toast.success("Téléchargement du bulletin...");
  };

  // ── Export PDF avec jsPDF ──
  const handleExportBulletin = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 20;
      let y = 25;

      // Titre
      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text("BULLETIN DE RÉSULTATS", pageWidth / 2, y, { align: "center" });
      y += 12;

      // Ligne de séparation
      doc.setDrawColor(99, 102, 241);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Informations utilisateur
      const studentName = `${firstName} ${lastName}`.trim() || "Étudiant";
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);

      const infoItems = [
        { label: "Candidat", value: studentName },
        { label: "Domaine", value: domaineNom || domaine || "Non spécifié" },
        { label: "Niveau", value: niveauNom || niveau || "Non spécifié" },
        { label: "Matière", value: matiereNom || matiere || "Non spécifié" },
        { label: "Date", value: new Date().toLocaleDateString("fr-FR") },
      ];

      infoItems.forEach((item) => {
        doc.setTextColor(100);
        doc.text(`${item.label}:`, margin, y);
        doc.setTextColor(0);
        doc.text(item.value, margin + 50, y);
        y += 7;
      });
      y += 8;

      // Résumé des résultats
      const appreciation = getAppreciation();

      doc.setFontSize(16);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text("RÉSUMÉ DES RÉSULTATS", pageWidth / 2, y, { align: "center" });
      y += 10;

      doc.autoTable({
        startY: y,
        head: [["Indicateur", "Valeur"]],
        body: [
          ["Score obtenu", `${correct} / ${totalQuestions}`],
          ["Pourcentage de réussite", `${percentage}%`],
          ["Appréciation", `${appreciation.icon} ${appreciation.text}`],
          ["Statut", passed ? "✅ RÉUSSI" : "❌ ÉCHOUÉ"],
          ["Réponses correctes", correct.toString()],
          ["Réponses incorrectes", incorrect.toString()],
          ["Questions non répondues", unanswered.toString()],
        ],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { cellPadding: 6, fontSize: 10 },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 15;

      // Détail des réponses
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text("DÉTAIL DES RÉPONSES", pageWidth / 2, y, { align: "center" });
      y += 10;

      const detailRows = quizQuestions.map((q, index) => {
        const { isCorrect, userAnswer, correctAnswer } = getAnswerStatus(index);
        return [
          `${index + 1}`,
          q.text?.substring(0, 40) + (q.text?.length > 40 ? "..." : ""),
          isCorrect ? "✓" : userAnswer !== "Non répondu" ? "✗" : "—",
          userAnswer,
          correctAnswer,
        ];
      });

      doc.autoTable({
        startY: y,
        head: [["N°", "Question", "S", "Votre réponse", "Bonne réponse"]],
        body: detailRows,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { cellPadding: 4, fontSize: 8 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 15 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 },
        },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Généré le ${new Date().toLocaleString("fr-FR")} - NA²Quiz`,
          pageWidth / 2,
          285,
          { align: "center" },
        );
      }

      const safeTitle = (matiereNom || matiere || "quiz").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      doc.save(`bulletin_${studentName.replace(/\s/g, "_")}_${safeTitle}.pdf`);

      toast.success("PDF généré avec succès !");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExporting(false);
    }
  };

  // ── Export avec html2canvas ──
  const handleExportWithCanvas = async () => {
    setExporting(true);
    try {
      const element = document.getElementById("review-content");
      if (!element) {
        toast.error("Contenu non trouvé");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#0f172a",
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width * 0.75, canvas.height * 0.75],
      });

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        canvas.width * 0.75,
        canvas.height * 0.75,
      );

      const studentName = `${firstName} ${lastName}`.trim() || "etudiant";
      pdf.save(`bulletin_${studentName}.pdf`);

      toast.success("PDF généré avec succès !");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExporting(false);
    }
  };

  // ── Impression ──
  const handlePrint = () => {
    window.print();
  };

  const appreciation = getAppreciation();
  const studentName = `${firstName} ${lastName}`.trim() || "Étudiant";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
        position: "relative",
        padding: "24px",
      }}
    >
      <NavHome />
      {/* Grille de fond */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Glow effect */}
      <div
        style={{
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
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
        }}
        id="review-content"
        ref={contentRef}
      >
        {/* En-tête */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              padding: 12,
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: 4,
              }}
            >
              Révision détaillée
            </h1>
            <p style={{ color: "#64748b" }}>
              {studentName} • {domaineNom || domaine || "Domaine"} •{" "}
              {niveauNom || niveau || "Niveau"} •{" "}
              {matiereNom || matiere || "Matière"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* ✅ Bouton Télécharger bulletin */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadBulletin}
              style={{
                padding: "10px 16px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: 10,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              Bulletin PDF
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportBulletin}
              disabled={exporting}
              style={{
                padding: "10px 16px",
                background: exporting
                  ? "rgba(99,102,241,0.3)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 10,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? "Génération..." : <FileText size={16} />}
              {exporting ? "..." : "Exporter PDF"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              style={{
                padding: "10px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 10,
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Printer size={16} />
              Imprimer
            </motion.button>
          </div>
        </div>

        {/* Résumé */}
        <div
          style={{
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: `conic-gradient(${appreciation.color} ${percentage * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    background: "#0f172a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                    }}
                  >
                    {correct}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    /{totalQuestions}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: appreciation.color,
                }}
              >
                {appreciation.icon} {appreciation.text}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 16px",
                  borderRadius: 20,
                  background: passed
                    ? "rgba(16,185,129,0.2)"
                    : "rgba(239,68,68,0.2)",
                  color: passed ? "#10b981" : "#ef4444",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                {passed ? "✅ RÉUSSI" : "❌ ÉCHOUÉ"}
              </span>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                Statistiques
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    Correctes
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    {correct}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    Incorrectes
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "#ef4444",
                    }}
                  >
                    {incorrect}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    Précision
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                    }}
                  >
                    {percentage}%
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginBottom: 4,
                    }}
                  >
                    Non répondues
                  </div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      color: "#6366f1",
                    }}
                  >
                    {unanswered}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation des questions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10,
              color: currentQuestion === 0 ? "#4b5563" : "#94a3b8",
              cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
              opacity: currentQuestion === 0 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            Précédent
          </button>

          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {quizQuestions.map((_, index) => {
              const { isCorrect, isAnswered } = getAnswerStatus(index);
              let bgColor = "rgba(255,255,255,0.05)";
              let borderColor = "rgba(99,102,241,0.2)";
              let textColor = "#94a3b8";

              if (index === currentQuestion) {
                bgColor = "#6366f1";
                textColor = "white";
              } else if (isAnswered && isCorrect) {
                bgColor = "rgba(16,185,129,0.2)";
                borderColor = "#10b981";
                textColor = "#10b981";
              } else if (isAnswered && !isCorrect) {
                bgColor = "rgba(239,68,68,0.2)";
                borderColor = "#ef4444";
                textColor = "#ef4444";
              }

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentQuestion((prev) =>
                Math.min(totalQuestions - 1, prev + 1),
              )
            }
            disabled={currentQuestion === totalQuestions - 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10,
              color:
                currentQuestion === totalQuestions - 1 ? "#4b5563" : "#94a3b8",
              cursor:
                currentQuestion === totalQuestions - 1
                  ? "not-allowed"
                  : "pointer",
              opacity: currentQuestion === totalQuestions - 1 ? 0.5 : 1,
            }}
          >
            Suivant
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Question détaillée */}
        {quizQuestions[currentQuestion] && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: getAnswerStatus(currentQuestion).isCorrect
                    ? "#10b981"
                    : getAnswerStatus(currentQuestion).isAnswered
                      ? "#ef4444"
                      : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {currentQuestion + 1}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {getAnswerStatus(currentQuestion).isCorrect
                  ? "Correct"
                  : getAnswerStatus(currentQuestion).isAnswered
                    ? "Incorrect"
                    : "Non répondu"}
              </span>
              {getAnswerStatus(currentQuestion).isCorrect ? (
                <CheckCircle size={20} color="#10b981" />
              ) : getAnswerStatus(currentQuestion).isAnswered ? (
                <XCircle size={20} color="#ef4444" />
              ) : (
                <HelpCircle size={20} color="#64748b" />
              )}
            </div>

            <p
              style={{
                fontSize: "1.1rem",
                color: "#f8fafc",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {quizQuestions[currentQuestion].text ||
                quizQuestions[currentQuestion].question}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {quizQuestions[currentQuestion].options.map((opt, index) => {
                const isUserAnswer = userAnswers[currentQuestion] === opt;
                const isCorrectAnswer =
                  opt === quizQuestions[currentQuestion].correctAnswer;

                let bgColor = "rgba(255,255,255,0.02)";
                let borderColor = "rgba(99,102,241,0.2)";
                let textColor = "#94a3b8";
                let icon = null;

                if (isCorrectAnswer) {
                  bgColor = "rgba(16,185,129,0.1)";
                  borderColor = "#10b981";
                  textColor = "#10b981";
                  icon = <CheckCircle size={14} color="#10b981" />;
                } else if (isUserAnswer && !isCorrectAnswer) {
                  bgColor = "rgba(239,68,68,0.1)";
                  borderColor = "#ef4444";
                  textColor = "#ef4444";
                  icon = <XCircle size={14} color="#ef4444" />;
                }

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 10,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: textColor,
                        minWidth: 24,
                      }}
                    >
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span style={{ color: textColor, flex: 1 }}>{opt}</span>
                    {icon}
                    {isUserAnswer && !isCorrectAnswer && (
                      <span style={{ fontSize: "0.7rem", color: "#ef4444" }}>
                        (votre réponse)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {quizQuestions[currentQuestion].explanation && (
              <div
                style={{
                  padding: 16,
                  background: "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 10,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <HelpCircle size={16} color="#6366f1" />
                  <span
                    style={{
                      color: "#a5b4fc",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    EXPLICATION
                  </span>
                </div>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {quizQuestions[currentQuestion].explanation}
                </p>
              </div>
            )}

            <div
              style={{
                marginTop: 20,
                padding: 12,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>Votre réponse: </span>
                <span
                  style={{
                    color: getAnswerStatus(currentQuestion).isCorrect
                      ? "#10b981"
                      : getAnswerStatus(currentQuestion).isAnswered
                        ? "#ef4444"
                        : "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  {getAnswerStatus(currentQuestion).userAnswer}
                </span>
              </div>
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>Bonne réponse: </span>
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  {quizQuestions[currentQuestion].correctAnswer}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bouton retour */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/exams")}
            style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontSize: "1rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Home size={18} />
            Retour aux examens
          </motion.button>
        </div>
      </main>
    </div>
  );
};

export default ReviewPage;
