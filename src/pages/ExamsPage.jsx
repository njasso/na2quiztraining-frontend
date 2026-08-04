// src/pages/ExamsPage.jsx - Version complète corrigée
// ✅ CORRECTION: Ne pas envoyer status quand 'all'
// ✅ CORRECTION: Gestion des erreurs améliorée
// ✅ CORRECTION: Affichage des examens publiés et brouillons

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  Clock,
  Layers,
  Eye,
  Play,
  Edit,
  Trash2,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Loader,
  FileText,
  FileCheck,
  Archive,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { getExams, deleteExam } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isScopeExemptRole, isContentInScope } from "../utils/educationScope";
import { canViewExam } from "../utils/examVisibility";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const ExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [examCode, setExamCode] = useState("");
  const [codeLookupLoading, setCodeLookupLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  // ✅ Charger les examens - VERSION CORRIGÉE
  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📥 Chargement des examens...");
      console.log("🔍 statusFilter:", statusFilter);

      // ✅ Construire les paramètres
      const params = {
        filter,
        limit: 100,
      };

      // 🔒 Un utilisateur standard ne doit recevoir que les examens de son
      // propre niveau. On transmet le périmètre au backend (qui DOIT filtrer
      // côté serveur — voir rapport d'audit) et on refiltre aussi côté
      // client ci-dessous en filet de sécurité, au cas où le backend
      // renverrait encore tout.
      if (!isScopeExemptRole(user) && user?.education) {
        params.domainId = user.education.domainId;
        params.sousDomaineId = user.education.sousDomaineId;
        params.levelId = user.education.levelId;
      }

      // ✅ NE PAS envoyer status si 'all'
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
        console.log("📤 Filtre status envoyé:", statusFilter);
      } else {
        console.log("📤 Pas de filtre status (tous les examens)");
      }

      if (search) {
        params.search = search;
      }

      console.log("📤 Paramètres complets:", params);

      const data = await getExams(params);
      console.log("📦 Données reçues:", data);

      let examsArray = [];

      if (Array.isArray(data)) {
        examsArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        examsArray = data.data;
      } else {
        examsArray = [];
      }

      // 🔒 Filet de sécurité côté client : ne jamais afficher un examen
      // hors du périmètre de l'utilisateur, même si le backend en renvoie.
      if (!isScopeExemptRole(user)) {
        examsArray = examsArray.filter((exam) => isContentInScope(user, exam));
        // Une épreuve "assignée" ne doit être visible que par les
        // apprenants listés (ou son auteur) ; une épreuve "privée" que par
        // son auteur — voir document de recommandations §7.
        examsArray = examsArray.filter((exam) => canViewExam(user, exam));
      }

      console.log(`📊 ${examsArray.length} examens chargés`);

      setExams(examsArray);

      // Afficher un résumé
      if (examsArray.length > 0) {
        const draftCount = examsArray.filter(
          (e) => e.status === "draft",
        ).length;
        const publishedCount = examsArray.filter(
          (e) => e.status === "published",
        ).length;
        const archivedCount = examsArray.filter(
          (e) => e.status === "archived",
        ).length;

        toast.success(
          `${examsArray.length} examens (${publishedCount} publiés, ${draftCount} brouillons, ${archivedCount} archivés)`,
          { duration: 3000 },
        );
      } else {
        toast("Aucun examen trouvé", {
          icon: "ℹ️",
          style: { background: "#1e293b", color: "#94a3b8" },
        });
      }
    } catch (error) {
      console.error("❌ Erreur chargement examens:", error);
      setError("Impossible de charger les examens. Veuillez réessayer.");

      // Fallback vers localStorage
      try {
        const savedExams = JSON.parse(
          localStorage.getItem("manual_quizzes") || "[]",
        );
        const generatedExams = JSON.parse(
          localStorage.getItem("generated_quizzes") || "[]",
        );
        const databaseExams = JSON.parse(
          localStorage.getItem("database_quizzes") || "[]",
        );

        const allExams = [...savedExams, ...generatedExams, ...databaseExams];
        allExams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (allExams.length > 0) {
          setExams(allExams);
          toast.success(`${allExams.length} examens chargés (mode local)`);
        }
      } catch (e) {
        console.error("Erreur fallback localStorage:", e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, statusFilter, search]);

  // Effet pour charger les examens
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Rafraîchir
  const handleRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  // Supprimer un examen
  const handleDelete = async (examId) => {
    try {
      await deleteExam(examId);
      toast.success("Examen supprimé avec succès");
      setDeleteConfirm(null);
      fetchExams();
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  /**
   * Accès direct à une épreuve via son code de partage (document de
   * recommandations §4.3). Contourne volontairement le filtre de
   * visibilité/périmètre : présenter le code EST l'autorisation — c'est le
   * mécanisme prévu pour qu'un formateur partage une épreuve "assignée" à
   * des apprenants hors de sa liste nommée (ex: via WhatsApp).
   */
  const handleAccessByCode = async () => {
    const code = examCode.trim().toUpperCase();
    if (!code) return;
    setCodeLookupLoading(true);
    try {
      const data = await getExams({ code });
      const found = Array.isArray(data) ? data[0] : Array.isArray(data?.data) ? data.data[0] : null;
      if (!found) {
        toast.error("Aucune épreuve ne correspond à ce code.");
        return;
      }
      navigate(`/exam/${found._id || found.id}`);
    } catch (err) {
      console.error("Erreur recherche par code:", err);
      toast.error("Impossible de trouver cette épreuve.");
    } finally {
      setCodeLookupLoading(false);
    }
  };

  // Filtrer les examens (recherche côté client en plus de l'API)
  const filteredExams = exams.filter((exam) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      exam.title?.toLowerCase().includes(searchLower) ||
      exam.domain?.toLowerCase().includes(searchLower) ||
      exam.subject?.toLowerCase().includes(searchLower) ||
      exam.matiereNom?.toLowerCase().includes(searchLower) ||
      exam.domainNom?.toLowerCase().includes(searchLower)
    );
  });

  // Couleurs par domaine
  const domainColor = (domain) => {
    const colors = {
      Éducatif: "#6366f1",
      Professionnel: "#10b981",
      "Spiritualité et Culture Camerounaise": "#f59e0b",
      1: "#6366f1",
      2: "#10b981",
      3: "#f59e0b",
    };
    return colors[domain] || "#64748b";
  };

  // Configuration du statut
  const statusConfig = {
    draft: {
      label: "Brouillon",
      icon: <Edit size={14} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.3)",
    },
    published: {
      label: "Publié",
      icon: <FileCheck size={14} />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.3)",
    },
    archived: {
      label: "Archivé",
      icon: <Archive size={14} />,
      color: "#64748b",
      bg: "rgba(100,116,139,0.15)",
      border: "rgba(100,116,139,0.3)",
    },
  };

  // Composant bouton d'action
  const ActionButton = ({ icon, color, onClick, label }) => (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={label}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color: color,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {icon}
    </motion.button>
  );

  // Composant carte d'examen
  const ExamCard = ({ exam, index }) => {
    const color = domainColor(exam.domain || exam.domainNom);
    const [isHovered, setIsHovered] = useState(false);
    const examId = exam._id || exam.id;
    const status = exam.status || "draft";
    const statusInfo = statusConfig[status] || statusConfig.draft;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          background: "rgba(15,23,42,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${isHovered ? color : "rgba(99,102,241,0.15)"}`,
          borderRadius: 20,
          padding: 24,
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
          cursor: "pointer",
          opacity: status === "archived" ? 0.6 : 1,
        }}
        onClick={() => navigate(`/exam/${examId}`, { state: { exam } })}
      >
        {/* Barre d'accentuation */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${color}, ${statusInfo.color})`,
            transition: "all 0.3s",
          }}
        />

        {/* En-tête */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#f8fafc",
              flex: 1,
              marginRight: 12,
              lineHeight: 1.4,
            }}
          >
            {exam.title || "Sans titre"}
          </h3>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {/* Badge de statut */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                background: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
                borderRadius: 12,
                color: statusInfo.color,
                fontSize: "0.65rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>
            {/* Badge de points */}
            <span
              style={{
                padding: "4px 10px",
                background: `${color}20`,
                border: `1px solid ${color}40`,
                borderRadius: 12,
                color: color,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {exam.totalPoints || exam.points || 0} pts
            </span>
          </div>
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
          }}
        >
          {(exam.domainNom || exam.domain) && (
            <span
              style={{
                padding: "4px 10px",
                background: `${color}15`,
                borderRadius: 8,
                color: color,
                fontSize: "0.75rem",
              }}
            >
              📚 {exam.domainNom || exam.domain}
            </span>
          )}
          {(exam.levelNom || exam.level) && (
            <span
              style={{
                padding: "4px 10px",
                background: "rgba(99,102,241,0.1)",
                borderRadius: 8,
                color: "#a5b4fc",
                fontSize: "0.75rem",
              }}
            >
              🎯 {exam.levelNom || exam.level}
            </span>
          )}
          {(exam.matiereNom || exam.subject) && (
            <span
              style={{
                padding: "4px 10px",
                background: "rgba(16,185,129,0.1)",
                borderRadius: 8,
                color: "#34d399",
                fontSize: "0.75rem",
              }}
            >
              📖 {exam.matiereNom || exam.subject}
            </span>
          )}
        </div>

        {/* Statistiques */}
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="#64748b" />
            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              {exam.duration || 0} min
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={14} color="#64748b" />
            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              {exam.questions?.length || exam.questionCount || 0} questions
            </span>
          </div>
          {exam.createdAt && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#64748b", fontSize: "0.7rem" }}>
                {new Date(exam.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton
              icon={<Play size={14} />}
              color="#10b981"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exam/${examId}`, { state: { exam } });
              }}
              label="Commencer"
            />
          </div>

          {deleteConfirm === examId ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(null);
                }}
                style={{
                  padding: "6px 12px",
                  background: "rgba(239,68,68,0.2)",
                  border: "1px solid #ef4444",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(examId);
                }}
                style={{
                  padding: "6px 12px",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirmer
              </button>
            </div>
          ) : (
            <ActionButton
              icon={<Trash2 size={14} />}
              color="#ef4444"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(examId);
              }}
              label="Supprimer"
            />
          )}
        </div>

        {/* Badge "Nouveau" */}
        {exam.createdAt &&
          new Date() - new Date(exam.createdAt) < 24 * 60 * 60 * 1000 && (
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                padding: "2px 10px",
                background: "rgba(16,185,129,0.2)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 12,
                color: "#34d399",
                fontSize: "0.55rem",
                fontWeight: 600,
              }}
            >
              NOUVEAU
            </div>
          )}
      </motion.div>
    );
  };

  // Affichage du chargement
  if (loading && !refreshing) {
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
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: "#94a3b8", marginTop: 16 }}>
            Chargement des examens...
          </p>
        </div>
      </div>
    );
  }

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
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* Bouton retour */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/quizzes")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} />
            <span>Retour au tableau de bord</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 12,
              color: "#60a5fa",
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </motion.button>
        </div>

        {/* En-tête */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: 4,
              }}
            >
              Examens disponibles
            </h1>
            <p style={{ color: "#64748b" }}>
              {exams.length} examen{exams.length > 1 ? "s" : ""} au total
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Barre de recherche */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  padding: "10px 12px 10px 40px",
                  width: 200,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  outline: "none",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            {/* ✅ Accès direct via un code de partage (document §4.3) */}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAccessByCode()}
                placeholder="Code d'épreuve (ex: EDU-MAT-TC-A427)"
                style={{
                  padding: "10px 12px",
                  width: 220,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
              <button
                onClick={handleAccessByCode}
                disabled={codeLookupLoading || !examCode.trim()}
                style={{
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: codeLookupLoading || !examCode.trim() ? "not-allowed" : "pointer",
                  opacity: codeLookupLoading || !examCode.trim() ? 0.6 : 1,
                }}
              >
                {codeLookupLoading ? "..." : "Accéder"}
              </button>
            </div>

            {/* ✅ Filtre de statut - 'all' par défaut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 12,
                color: "#f8fafc",
                outline: "none",
                fontSize: "0.9rem",
                minWidth: 140,
              }}
            >
              <option value="all">📋 Tous les statuts</option>
              <option value="published">✅ Publiés</option>
              <option value="draft">📝 Brouillons</option>
              <option value="archived">📦 Archivés</option>
            </select>

            {/* Filtre de tri */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 12,
                color: "#f8fafc",
                outline: "none",
                fontSize: "0.9rem",
                minWidth: 120,
              }}
            >
              <option value="all">📅 Tous</option>
              <option value="recent">🕐 Récents</option>
              <option value="popular">⭐ Populaires</option>
            </select>

            {/* Nouvel examen — réservé aux formateurs/admins */}
            {isScopeExemptRole(user) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/create-exam")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                <Plus size={16} />
                Nouvel examen
              </motion.button>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: "#fca5a5", flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <XCircle size={18} />
            </button>
          </motion.div>
        )}

        {/* Liste des examens */}
        {filteredExams.length === 0 ? (
          <div
            style={{
              background: "rgba(15,23,42,0.5)",
              border: "1px dashed rgba(99,102,241,0.3)",
              borderRadius: 24,
              padding: 60,
              textAlign: "center",
            }}
          >
            <BookOpen size={48} color="#1e293b" style={{ marginBottom: 16 }} />
            <h3
              style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: 8 }}
            >
              {search || statusFilter !== "all"
                ? "Aucun résultat"
                : "Aucun examen trouvé"}
            </h3>
            <p style={{ color: "#64748b", marginBottom: 20 }}>
              {search || statusFilter !== "all"
                ? "Essayez d'autres filtres ou termes de recherche"
                : isScopeExemptRole(user)
                  ? "Créez votre premier examen"
                  : "Revenez plus tard, votre formateur n'a pas encore publié d'examen"}
            </p>
            {!search && statusFilter === "all" && isScopeExemptRole(user) && (
              <button
                onClick={() => navigate("/create-exam")}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Créer un examen
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 20,
            }}
          >
            <AnimatePresence>
              {filteredExams.map((exam, index) => (
                <ExamCard
                  key={exam._id || exam.id || index}
                  exam={exam}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99,102,241,0.5);
        }
      `}</style>
    </div>
  );
};

export default ExamsPage;
