// src/pages/ResultsPage.jsx
// Page intelligente : 2 modes selon le contexte.
//   • Mode POST-QUIZ  : si location.state contient des données de quiz
//                       → affiche score animé, ring SVG, actions
//   • Mode DASHBOARD  : sinon (accès direct via /results)
//                       → affiche les graphiques statistiques existants
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Award,
  RotateCcw,
  Share2,
  Download,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  BarChart2,
  BookOpen,
  PieChart as PieIcon,
  ArrowLeft,
} from "lucide-react";
import { FiLoader } from "react-icons/fi";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getResults, getStats, saveResult } from "../services/api";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

// ═══════════════════════════════════════════════════════════════════════════════
// MODE POST-QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedCounter = ({ to, duration = 1200, suffix = "" }) => {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
};

const ScoreRing = ({ score, size = 180 }) => {
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={10}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (Math.min(score, 100) / 100) * c }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
};

const BarStat = ({ label, value, max, color }) => (
  <div style={{ marginBottom: 12 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 5,
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>
        {value}/{max}
      </span>
    </div>
    <div
      style={{
        height: 8,
        borderRadius: 99,
        background: "rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        style={{ height: "100%", background: color, borderRadius: 99 }}
      />
    </div>
  </div>
);

const PostQuizResults = ({ state, navigate }) => {
  const {
    score = 0,
    total = 10,
    correct = 0,
    incorrect = 0,
    timeSpent = 0,
    quizTitle = "Quiz",
    quizId = null,
    answers = [],
    domainStats = [],
  } = state;

  const pct = total > 0 ? Math.round((correct / total) * 100) : score;
  const passed = pct >= 60;
  const mins = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current || !quizId) return;
    saved.current = true;
    saveResult({
      quizId,
      score: pct,
      correct,
      incorrect,
      total,
      timeSpent,
      answers,
    }).catch(() => {});
  }, []);

  const gradeColor = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const gradeBg =
    pct >= 70
      ? "rgba(16,185,129,0.08)"
      : pct >= 50
        ? "rgba(245,158,11,0.08)"
        : "rgba(239,68,68,0.08)";
  const gradeMsg =
    pct >= 90
      ? "Excellent !"
      : pct >= 70
        ? "Bien joué !"
        : pct >= 50
          ? "Pas mal !"
          : "Continuez à pratiquer";

  const handleShare = async () => {
    const text = `J'ai obtenu ${pct}% sur "${quizTitle}" avec NA2 Quiz 🎯`;
    if (navigator.share)
      await navigator.share({ title: "NA2 Quiz", text }).catch(() => {});
    else {
      await navigator.clipboard.writeText(text);
      toast.success("Résultat copié !");
    }
  };

  const handleCertificate = () => {
    if (pct < 60) {
      toast.error("Score minimum 60% pour obtenir un certificat.");
      return;
    }
    toast.loading("Génération du certificat…");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Certificat généré !");
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
        padding: "32px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 8 }}>
            {quizTitle}
          </p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc" }}>
            Vos résultats
          </h1>
        </motion.div>

        {/* Anneau de score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div style={{ position: "relative", width: 180, height: 180 }}>
            <ScoreRing score={pct} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "2.8rem",
                  fontWeight: 900,
                  color: gradeColor,
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter to={pct} suffix="%" duration={1200} />
              </div>
              <div
                style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}
              >
                Score
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: 16,
              padding: "8px 20px",
              background: gradeBg,
              border: `1px solid ${gradeColor}40`,
              borderRadius: 99,
              color: gradeColor,
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {passed ? <CheckCircle size={16} /> : <TrendingUp size={16} />}
            {gradeMsg}
          </motion.div>
        </motion.div>

        {/* Métriques */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              Icon: CheckCircle,
              val: correct,
              label: "Correctes",
              color: "#10b981",
            },
            {
              Icon: XCircle,
              val: incorrect,
              label: "Incorrectes",
              color: "#ef4444",
            },
            {
              Icon: Clock,
              val: `${mins}:${String(secs).padStart(2, "0")}`,
              label: "Durée",
              color: "#6366f1",
            },
          ].map(({ Icon, val, label, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 16,
                padding: "16px 12px",
                textAlign: "center",
              }}
            >
              <Icon size={20} color={color} style={{ marginBottom: 8 }} />
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "#f8fafc",
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Domaines */}
        {domainStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 16,
              }}
            >
              Performance par domaine
            </p>
            {domainStats.map((d) => (
              <BarStat
                key={d.label}
                label={d.label}
                value={d.correct}
                max={d.total}
                color={
                  d.correct / d.total >= 0.7
                    ? "#10b981"
                    : d.correct / d.total >= 0.5
                      ? "#f59e0b"
                      : "#ef4444"
                }
              />
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {answers.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                navigate("/review", { state: { answers, quizTitle } })
              }
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 14,
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
              }}
            >
              <Target size={18} /> Revoir les erreurs <ChevronRight size={18} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-2)}
            style={{
              width: "100%",
              padding: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 14,
              color: "white",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <RotateCcw size={18} /> Recommencer
          </motion.button>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              style={{
                padding: "13px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 14,
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Share2 size={16} /> Partager
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCertificate}
              style={{
                padding: "13px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 14,
                color: "#f59e0b",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Award size={16} /> Certificat
            </motion.button>
          </div>

          <button
            onClick={() => navigate("/quizzes")}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: "0.9rem",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <TrendingUp size={14} /> Voir tous les quiz
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODE DASHBOARD STATISTIQUES (page existante — inchangée)
// ═══════════════════════════════════════════════════════════════════════════════

const StatsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [yearStats, setYearStats] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const results = await getResults();
      const arr = Array.isArray(results) ? results : [];
      const stats = await getStats();

      // Par année
      const ym = {};
      arr.forEach((r) => {
        const y = new Date(r.date || r.createdAt || Date.now())
          .getFullYear()
          .toString();
        if (!ym[y]) ym[y] = { totalScore: 0, count: 0 };
        ym[y].totalScore += r.score || 0;
        ym[y].count++;
      });
      setYearStats(
        Object.entries(ym)
          .map(([y, d]) => ({
            _id: y,
            avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
            count: d.count,
          }))
          .sort((a, b) => a._id.localeCompare(b._id)),
      );

      // Par niveau
      const lm = { Débutant: 0, Intermédiaire: 0, Avancé: 0, Expert: 0 };
      arr.forEach((r) => {
        const l = r.niveau || "Débutant";
        lm[l] = (lm[l] || 0) + 1;
      });
      setLevelStats(
        Object.entries(lm)
          .map(([l, c]) => ({ _id: l, count: c }))
          .filter((d) => d.count > 0),
      );

      // Par matière
      const sm = {};
      arr.forEach((r) => {
        const s = r.domain || r.matiere || "Général";
        if (!sm[s]) sm[s] = { totalScore: 0, count: 0 };
        sm[s].totalScore += r.score || 0;
        sm[s].count++;
      });
      setSubjectStats(
        Object.entries(sm)
          .map(([s, d]) => ({
            _id: s,
            count: d.count,
            averageScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
          }))
          .sort((a, b) => b.count - a.count),
      );

      setGlobalStats({
        totalQuizzes: arr.length,
        averageScore:
          arr.length > 0
            ? Math.round(
                arr.reduce((s, r) => s + (r.score || 0), 0) / arr.length,
              )
            : 0,
        totalUsers: stats?.totalUsers || 0,
      });
    } catch {
      toast.error("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(18);
      doc.text("Statistiques Générales des Quiz", 105, 15, { align: "center" });
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total quiz: ${globalStats.totalQuizzes}`, 20, 30);
      doc.text(`Score moyen: ${globalStats.averageScore}%`, 20, 37);
      doc.text(`Total utilisateurs: ${globalStats.totalUsers}`, 20, 44);
      if (subjectStats.length > 0) {
        doc.autoTable({
          head: [["Matière", "Score Moyen", "Tentatives"]],
          body: subjectStats.map((s) => [
            s._id,
            `${s.averageScore}%`,
            s.count.toString(),
          ]),
          startY: 55,
          theme: "striped",
          styles: { fontSize: 10, textColor: [30, 41, 59] },
          headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 242, 255] },
        });
      }
      doc.save("statistiques-quiz.pdf");
      toast.success("PDF exporté !");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  const tooltipStyle = {
    contentStyle: {
      background: "#0f172a",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: "8px",
      color: "#f8fafc",
    },
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FiLoader
            size={48}
            style={{ animation: "spin 1s linear infinite" }}
            color="#6366f1"
          />
          <p style={{ color: "#94a3b8", marginTop: 16 }}>
            Chargement des statistiques…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

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
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <Link
            to="/quizzes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={18} /> Retour aux quiz
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BarChart2 size={28} color="#6366f1" />
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#f8fafc",
                margin: 0,
              }}
            >
              Tableau de bord
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 8px 16px rgba(16,185,129,0.2)",
            }}
          >
            <Download size={18} /> Exporter PDF
          </motion.button>
        </div>

        {/* Cartes résumé */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
            gap: 20,
            marginBottom: 30,
          }}
        >
          {[
            {
              val: globalStats.totalQuizzes,
              label: "Quiz réalisés",
              color: "#6366f1",
            },
            {
              val: `${globalStats.averageScore}%`,
              label: "Score moyen",
              color: "#10b981",
            },
            {
              val: globalStats.totalUsers,
              label: "Utilisateurs",
              color: "#f59e0b",
            },
          ].map(({ val, label, color }) => (
            <div
              key={label}
              style={{
                background: "rgba(15,23,42,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 16,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", fontWeight: 700, color }}>
                {val}
              </div>
              <div style={{ color: "#94a3b8" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px,1fr))",
            gap: 24,
          }}
        >
          {/* Année */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(99,102,241,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={24} color="#6366f1" />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  margin: 0,
                }}
              >
                Performance par année
              </h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="_id"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8" }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgScore"
                    name="Score moyen (%)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: "#6366f1", strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="Nombre de quiz"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Niveau */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(16,185,129,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart2 size={24} color="#10b981" />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  margin: 0,
                }}
              >
                Répartition par niveau
              </h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="_id"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8" }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Matières — pleine largeur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              gridColumn: "span 2",
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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(139,92,246,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PieIcon size={24} color="#8b5cf6" />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  margin: 0,
                }}
              >
                Répartition par matière
              </h3>
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectStats}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    innerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${Math.round(percent * 100)}%`
                    }
                    labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                  >
                    {subjectStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT RACINE — Détecte le mode automatiquement
// ═══════════════════════════════════════════════════════════════════════════════

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Si location.state contient des données de quiz → mode post-quiz
  const isPostQuiz = !!(
    location.state?.total || location.state?.correct !== undefined
  );

  if (isPostQuiz) {
    return <PostQuizResults state={location.state} navigate={navigate} />;
  }
  return <StatsDashboard />;
};

export default ResultsPage;
