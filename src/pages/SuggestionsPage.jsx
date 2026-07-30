// src/pages/SuggestionsPage.jsx - VERSION CORRIGÉE COMPLÈTE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  Loader,
  X,
} from "lucide-react";
import {
  getSuggestions,
  createSuggestion,
  voteSuggestion,
  addComment,
  getComments,
} from "../services/api";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const SuggestionsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "feature",
  });
  const [votedSuggestions, setVotedSuggestions] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState(new Set());

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }

    // Load user's votes from localStorage
    const savedVotes = localStorage.getItem("votedSuggestions");
    if (savedVotes) {
      try {
        setVotedSuggestions(new Set(JSON.parse(savedVotes)));
      } catch (e) {
        console.error("Erreur parsing votes:", e);
      }
    }

    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await getSuggestions();
      console.log("📊 Réponse brute suggestions:", response);

      // ✅ EXTRAIRE les données du wrapper { success: true, data: [...] }
      const data = response?.data || response || [];
      const suggestionsArray = Array.isArray(data) ? data : [];
      console.log("📊 Suggestions extraites:", suggestionsArray);

      setSuggestions(suggestionsArray);
    } catch (error) {
      console.error("❌ Erreur chargement suggestions:", error);
      toast.error("Impossible de charger les suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewSuggestion({
      ...newSuggestion,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!currentUser) {
      toast.error("Connectez-vous pour proposer une suggestion");
      return;
    }

    setSubmitting(true);
    try {
      const response = await createSuggestion({
        title: newSuggestion.title,
        description: newSuggestion.description,
        category: newSuggestion.category,
      });

      // ✅ Extraire la suggestion du wrapper
      const suggestion = response?.data || response;
      console.log("📊 Suggestion créée:", suggestion);

      setSuggestions([suggestion, ...suggestions]);
      setNewSuggestion({ title: "", description: "", category: "feature" });
      setShowForm(false);
      toast.success("Suggestion envoyée ! Merci pour votre contribution.");
    } catch (error) {
      console.error("❌ Error creating suggestion:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'envoi de la suggestion",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour voter");
      return;
    }

    if (votingInProgress.has(suggestionId)) return;

    setVotingInProgress((prev) => new Set(prev).add(suggestionId));

    try {
      const response = await voteSuggestion(suggestionId);
      console.log("📊 Vote response:", response);

      // ✅ Extraire les données du wrapper
      const voteData = response?.data || response;

      setSuggestions((prevSuggestions) =>
        prevSuggestions.map((s) =>
          s._id === suggestionId ? { ...s, votes: voteData.votes } : s,
        ),
      );

      setVotedSuggestions((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(suggestionId)) {
          newSet.delete(suggestionId);
        } else {
          newSet.add(suggestionId);
        }
        localStorage.setItem("votedSuggestions", JSON.stringify([...newSet]));
        return newSet;
      });

      toast.success(voteData.hasVoted ? "Vote enregistré" : "Vote retiré");
    } catch (error) {
      console.error("❌ Error voting:", error);
      toast.error(error.response?.data?.message || "Erreur lors du vote");
    } finally {
      setVotingInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  };

  const handleAddComment = async (suggestionId) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour commenter");
      return;
    }

    const comment = commentInput[suggestionId];
    if (!comment?.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    try {
      const response = await addComment(suggestionId, {
        text: comment.trim(),
      });

      // ✅ Extraire le commentaire du wrapper
      const newComment = response?.data || response;
      console.log("📊 Commentaire ajouté:", newComment);

      setSuggestions((prevSuggestions) =>
        prevSuggestions.map((s) =>
          s._id === suggestionId
            ? {
                ...s,
                comments: [...(s.comments || []), newComment],
                commentsCount: (s.commentsCount || 0) + 1,
              }
            : s,
        ),
      );

      setCommentInput({ ...commentInput, [suggestionId]: "" });
      toast.success("Commentaire ajouté");
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'ajout du commentaire",
      );
    }
  };

  const toggleComments = async (suggestionId) => {
    if (!showComments[suggestionId]) {
      try {
        const response = await getComments(suggestionId);

        // ✅ Extraire les commentaires du wrapper
        const comments = response?.data || response || [];
        console.log("📊 Commentaires chargés:", comments);

        setSuggestions((prevSuggestions) =>
          prevSuggestions.map((s) =>
            s._id === suggestionId ? { ...s, comments } : s,
          ),
        );
      } catch (error) {
        console.error("❌ Erreur chargement commentaires:", error);
        toast.error("Impossible de charger les commentaires");
      }
    }
    setShowComments({
      ...showComments,
      [suggestionId]: !showComments[suggestionId],
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "nouveau":
        return "#6366f1";
      case "en cours":
        return "#f59e0b";
      case "approuvé":
        return "#10b981";
      case "rejeté":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      return date.toLocaleDateString("fr-FR");
    } catch {
      return "Date inconnue";
    }
  };

  // ✅ Fonction pour obtenir le nom de l'auteur
  const getAuthorName = (suggestion) => {
    if (suggestion.author) return suggestion.author;
    if (suggestion.authorId) {
      if (typeof suggestion.authorId === "object") {
        const firstName = suggestion.authorId.firstName || "";
        const lastName = suggestion.authorId.lastName || "";
        return `${firstName} ${lastName}`.trim() || "Anonyme";
      }
    }
    return "Anonyme";
  };

  // ✅ Fonction pour obtenir l'initiale de l'auteur
  const getAuthorInitial = (suggestion) => {
    const name = getAuthorName(suggestion);
    return name.charAt(0) || "U";
  };

  // ✅ Fonction pour obtenir le nom du commentateur
  const getCommentAuthor = (comment) => {
    if (comment.author) return comment.author;
    if (comment.authorId) {
      if (typeof comment.authorId === "object") {
        const firstName = comment.authorId.firstName || "";
        const lastName = comment.authorId.lastName || "";
        return `${firstName} ${lastName}`.trim() || "Anonyme";
      }
    }
    return "Anonyme";
  };

  if (loading) {
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
      <NavHome />
        <div style={{ textAlign: "center" }}>
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: "#94a3b8", marginTop: 16 }}>
            Chargement des suggestions...
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
      {/* Background grid */}
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
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
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
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                marginBottom: 8,
              }}
            >
              <Lightbulb size={14} color="#f59e0b" />
              <span
                style={{
                  color: "#a5b4fc",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                SUGGESTIONS
              </span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#f8fafc" }}>
              Suggestions
            </h1>
            <p style={{ color: "#94a3b8" }}>
              Proposez vos idées pour améliorer la plateforme
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Nouvelle suggestion
          </motion.button>
        </div>

        {/* Suggestion Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: "rgba(15,23,42,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #6366f1",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                }}
              >
                Proposer une suggestion
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Catégorie
                </label>
                <select
                  name="category"
                  value={newSuggestion.category}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                    outline: "none",
                  }}
                >
                  <option value="feature">Nouvelle fonctionnalité</option>
                  <option value="content">Contenu / Quiz</option>
                  <option value="improvement">Amélioration</option>
                  <option value="bug">Signalement de bug</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Titre
                </label>
                <input
                  type="text"
                  name="title"
                  value={newSuggestion.title}
                  onChange={handleInputChange}
                  placeholder="Résumez votre suggestion en quelques mots"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Description détaillée
                </label>
                <textarea
                  name="description"
                  value={newSuggestion.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Expliquez votre idée en détail..."
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                    outline: "none",
                    resize: "vertical",
                  }}
                  required
                />
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 8,
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  <Send size={14} />
                  {submitting ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Suggestions List */}
        <div
          style={{
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          {suggestions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Lightbulb
                size={48}
                color="#1e293b"
                style={{ marginBottom: 16 }}
              />
              <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
                Aucune suggestion
              </p>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: 8 }}>
                Soyez le premier à proposer une idée !
              </p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => {
              const authorName = getAuthorName(suggestion);
              const authorInitial = getAuthorInitial(suggestion);

              return (
                <motion.div
                  key={suggestion._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: "20px",
                    borderBottom:
                      index < suggestions.length - 1
                        ? "1px solid rgba(99,102,241,0.1)"
                        : "none",
                  }}
                >
                  <div style={{ display: "flex", gap: 16 }}>
                    {/* Votes */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 60,
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleVote(suggestion._id)}
                        disabled={votingInProgress.has(suggestion._id)}
                        style={{
                          background: votedSuggestions.has(suggestion._id)
                            ? "rgba(99,102,241,0.2)"
                            : "rgba(99,102,241,0.1)",
                          border: `1px solid ${votedSuggestions.has(suggestion._id) ? "#6366f1" : "rgba(99,102,241,0.3)"}`,
                          borderRadius: 8,
                          padding: 6,
                          color: votedSuggestions.has(suggestion._id)
                            ? "#6366f1"
                            : "#a5b4fc",
                          cursor: votingInProgress.has(suggestion._id)
                            ? "wait"
                            : "pointer",
                          opacity: votingInProgress.has(suggestion._id)
                            ? 0.5
                            : 1,
                        }}
                      >
                        <ThumbsUp size={14} />
                      </motion.button>
                      <span
                        style={{
                          color: "#f8fafc",
                          fontWeight: 600,
                          margin: "4px 0",
                        }}
                      >
                        {suggestion.votes || 0}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: "0.6rem" }}>
                        votes
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#f8fafc",
                          }}
                        >
                          {suggestion.title}
                        </h3>
                        <span
                          style={{
                            padding: "2px 8px",
                            background: `${getStatusColor(suggestion.status)}20`,
                            border: `1px solid ${getStatusColor(suggestion.status)}`,
                            borderRadius: 12,
                            color: getStatusColor(suggestion.status),
                            fontSize: "0.6rem",
                            fontWeight: 600,
                          }}
                        >
                          {suggestion.status || "Nouveau"}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            background: "rgba(99,102,241,0.1)",
                            borderRadius: 12,
                            color: "#a5b4fc",
                            fontSize: "0.6rem",
                          }}
                        >
                          {suggestion.category || "feature"}
                        </span>
                      </div>

                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.9rem",
                          marginBottom: 12,
                        }}
                      >
                        {suggestion.description}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #6366f1, #8b5cf6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "0.6rem",
                              fontWeight: 600,
                            }}
                          >
                            {authorInitial}
                          </div>
                          <span
                            style={{ color: "#a5b4fc", fontSize: "0.8rem" }}
                          >
                            {authorName}
                          </span>
                        </div>

                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "0.7rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={12} />
                          {formatDate(suggestion.createdAt)}
                        </span>

                        <button
                          onClick={() => toggleComments(suggestion._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            fontSize: "0.7rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <MessageSquare size={12} />
                          {suggestion.commentsCount ||
                            suggestion.comments?.length ||
                            0}{" "}
                          commentaires
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[suggestion._id] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            marginTop: 16,
                            padding: 16,
                            background: "rgba(0,0,0,0.2)",
                            borderRadius: 12,
                          }}
                        >
                          {/* Comments List */}
                          {(suggestion.comments || []).length === 0 ? (
                            <p
                              style={{
                                color: "#64748b",
                                fontSize: "0.8rem",
                                textAlign: "center",
                                padding: "12px 0",
                              }}
                            >
                              Aucun commentaire pour le moment. Soyez le premier
                              à commenter !
                            </p>
                          ) : (
                            (suggestion.comments || []).map((comment, idx) => {
                              const commentAuthor = getCommentAuthor(comment);
                              const commentInitial =
                                commentAuthor.charAt(0) || "U";

                              return (
                                <div
                                  key={comment._id || idx}
                                  style={{
                                    padding: "12px 0",
                                    borderBottom:
                                      idx < suggestion.comments?.length - 1
                                        ? "1px solid rgba(255,255,255,0.05)"
                                        : "none",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginBottom: 4,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        background:
                                          "linear-gradient(135deg, #10b981, #059669)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "0.5rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {commentInitial}
                                    </div>
                                    <span
                                      style={{
                                        color: "#a5b4fc",
                                        fontSize: "0.7rem",
                                      }}
                                    >
                                      {commentAuthor}
                                    </span>
                                    <span
                                      style={{
                                        color: "#64748b",
                                        fontSize: "0.6rem",
                                      }}
                                    >
                                      {formatDate(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p
                                    style={{
                                      color: "#94a3b8",
                                      fontSize: "0.8rem",
                                      marginLeft: 28,
                                    }}
                                  >
                                    {comment.text}
                                  </p>
                                </div>
                              );
                            })
                          )}

                          {/* Add Comment Input */}
                          <div
                            style={{ display: "flex", gap: 8, marginTop: 12 }}
                          >
                            <input
                              type="text"
                              value={commentInput[suggestion._id] || ""}
                              onChange={(e) =>
                                setCommentInput({
                                  ...commentInput,
                                  [suggestion._id]: e.target.value,
                                })
                              }
                              placeholder="Ajouter un commentaire..."
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(99,102,241,0.2)",
                                borderRadius: 8,
                                color: "#f8fafc",
                                outline: "none",
                                fontSize: "0.8rem",
                              }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleAddComment(suggestion._id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(suggestion._id)}
                              style={{
                                padding: "8px 16px",
                                background:
                                  "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                border: "none",
                                borderRadius: 8,
                                color: "white",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                              }}
                            >
                              Envoyer
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
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

export default SuggestionsPage;
