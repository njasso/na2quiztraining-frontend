// src/pages/CreateCommunityQuizPage.jsx
// ✅ Version complète avec appel à l'API

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Globe,
  Lock,
  Users,
  BookOpen,
  Award,
  Loader,
  X,
} from "lucide-react";
import { createQuiz } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import {
  getAllDomaines,
  getLevelNom,
} from "../data/domainConfig";
import {
  hasEducationScope,
  isScopeExemptRole,
  getVisibleSousDomaines,
  getVisibleLevels,
  getAllowedMatieres,
} from "../utils/educationScope";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const CreateCommunityQuizPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateQuiz, recordQuizCreated } = useSubscription();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // ✅ Document de recommandations §5 : les quiz communautaires suivent
    // désormais le même référentiel que les épreuves, pour rester filtrés
    // par niveau côté apprenant (voir CommunityPage.jsx).
    domainId: "",
    sousDomaineId: "",
    levelId: "",
    matiereId: "",
    difficulty: "moyen",
    isPublic: true,
    tags: [],
    questions: [],
  });

  const scopeLocked = hasEducationScope(user) && !isScopeExemptRole(user);
  const domains = getAllDomaines();
  const sousDomaines = formData.domainId ? getVisibleSousDomaines(user, formData.domainId) : [];
  const levels = formData.sousDomaineId ? getVisibleLevels(user, formData.domainId, formData.sousDomaineId) : [];
  const matieres = formData.sousDomaineId ? getAllowedMatieres(user, formData.domainId, formData.sousDomaineId) : [];

  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    options: ["", ""],
    correctAnswer: 0,
    points: 1,
  });

  const [tagInput, setTagInput] = useState("");

  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast.error("Le texte de la question est requis");
      return;
    }
    if (currentQuestion.options.some((opt) => !opt.trim())) {
      toast.error("Toutes les options doivent être remplies");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }],
    }));
    setCurrentQuestion({
      text: "",
      options: ["", ""],
      correctAnswer: 0,
      points: 1,
    });
    toast.success("Question ajoutée !");
  };

  const handleRemoveQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!formData.domainId || !formData.sousDomaineId || !formData.levelId || !formData.matiereId) {
      toast.error("Veuillez sélectionner le référentiel complet (domaine, filière, niveau, matière)");
      return;
    }
    if (formData.questions.length < 1) {
      toast.error("Ajoutez au moins une question");
      return;
    }

    // 🔒 Garde anti-contournement, comme sur les autres flux de création.
    if (scopeLocked) {
      const stillAllowed =
        String(formData.domainId) === String(user.education.domainId) &&
        String(formData.sousDomaineId) === String(user.education.sousDomaineId) &&
        String(formData.levelId) === String(user.education.levelId);
      if (!stillAllowed) {
        toast.error("Cette sélection ne correspond pas à votre niveau d'étude.");
        return;
      }
    }

    // 🔒 Même quota quotidien que les autres flux de création (Manuel,
    // Banque, IA) — sans ça, ce circuit contournait la limite du plan.
    if (!canCreateQuiz()) return;

    setLoading(true);
    try {
      const quizData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        domainId: formData.domainId,
        sousDomaineId: formData.sousDomaineId,
        levelId: formData.levelId,
        matiereId: formData.matiereId,
        difficulty: formData.difficulty,
        isPublic: formData.isPublic,
        tags: formData.tags,
        questions: formData.questions.map((q) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
        })),
        author: user?._id || user?.id,
        status: "published",
      };

      console.log("📤 Envoi quiz communautaire:", quizData);

      const response = await createQuiz(quizData);
      console.log("✅ Réponse:", response);

      recordQuizCreated();
      toast.success("🎉 Quiz communautaire créé avec succès !");
      setTimeout(() => navigate("/community"), 1500);
    } catch (error) {
      console.error("❌ Erreur création quiz:", error);
      toast.error(error.message || "Erreur lors de la création du quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <NavHome />
      <div style={styles.backgroundGrid} />
      <div style={styles.backgroundGlow} />

      <main style={styles.main}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/community")}
          style={styles.backButton}
        >
          <ArrowLeft size={20} /> Retour
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.card}
        >
          <h1 style={styles.title}>Créer un quiz communautaire</h1>
          <p style={styles.subtitle}>
            Partagez vos connaissances avec la communauté
          </p>

          {/* Informations de base */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Informations</h2>

            <div style={styles.field}>
              <label style={styles.label}>Titre du quiz *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Mon quiz communautaire"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Décrivez votre quiz..."
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={styles.field}>
                <label style={styles.label}>Domaine</label>
                <select
                  value={formData.domainId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      domainId: e.target.value,
                      sousDomaineId: '',
                      levelId: '',
                      matiereId: '',
                    }))
                  }
                  disabled={scopeLocked}
                  style={{ ...styles.select, opacity: scopeLocked ? 0.6 : 1 }}
                >
                  <option value="">Sélectionner...</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Filière</label>
                <select
                  value={formData.sousDomaineId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sousDomaineId: e.target.value, levelId: '', matiereId: '' }))
                  }
                  disabled={scopeLocked || !formData.domainId}
                  style={{ ...styles.select, opacity: (scopeLocked || !formData.domainId) ? 0.6 : 1 }}
                >
                  <option value="">Sélectionner...</option>
                  {sousDomaines.map((sd) => (
                    <option key={sd.id} value={sd.id}>{sd.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Niveau</label>
                <select
                  value={formData.levelId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, levelId: e.target.value }))}
                  disabled={scopeLocked || !formData.sousDomaineId}
                  style={{ ...styles.select, opacity: (scopeLocked || !formData.sousDomaineId) ? 0.6 : 1 }}
                >
                  <option value="">Sélectionner...</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Matière</label>
                <select
                  value={formData.matiereId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, matiereId: e.target.value }))}
                  disabled={!formData.sousDomaineId}
                  style={{ ...styles.select, opacity: !formData.sousDomaineId ? 0.6 : 1 }}
                >
                  <option value="">Sélectionner...</option>
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Difficulté</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  style={styles.select}
                >
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Visibilité</label>
              <div style={{ display: "flex", gap: 12 }}>
                <label
                  style={{
                    ...styles.radioLabel,
                    background: formData.isPublic
                      ? "rgba(16,185,129,0.1)"
                      : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    checked={formData.isPublic}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPublic: true }))
                    }
                  />
                  <Globe size={16} color="#10b981" />
                  Public
                </label>
                <label
                  style={{
                    ...styles.radioLabel,
                    background: !formData.isPublic
                      ? "rgba(239,68,68,0.1)"
                      : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    checked={!formData.isPublic}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPublic: false }))
                    }
                  />
                  <Lock size={16} color="#ef4444" />
                  Privé
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Questions</h2>
            <p style={styles.sectionSubtitle}>
              {formData.questions.length} question
              {formData.questions.length > 1 ? "s" : ""} ajoutée
              {formData.questions.length > 1 ? "s" : ""}
            </p>

            {/* Ajout d'une question */}
            <div style={styles.addQuestionCard}>
              <input
                type="text"
                value={currentQuestion.text}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                placeholder="Texte de la question..."
                style={styles.input}
              />

              <div style={{ marginTop: 12 }}>
                {currentQuestion.options.map((opt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        minWidth: 24,
                      }}
                    >
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[idx] = e.target.value;
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          options: newOptions,
                        }));
                      }}
                      placeholder={`Option ${idx + 1}`}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    {idx > 1 && (
                      <button
                        onClick={() => {
                          const newOptions = currentQuestion.options.filter(
                            (_, i) => i !== idx,
                          );
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            options: newOptions,
                          }));
                        }}
                        style={styles.removeOption}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() =>
                    setCurrentQuestion((prev) => ({
                      ...prev,
                      options: [...prev.options, ""],
                    }))
                  }
                  style={styles.addOption}
                >
                  <Plus size={14} /> Ajouter une option
                </button>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.labelSmall}>Bonne réponse</label>
                    <select
                      value={currentQuestion.correctAnswer}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          correctAnswer: parseInt(e.target.value),
                        }))
                      }
                      style={styles.select}
                    >
                      {currentQuestion.options.map((_, idx) => (
                        <option key={idx} value={idx}>
                          Option {String.fromCharCode(65 + idx)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 100 }}>
                    <label style={styles.labelSmall}>Points</label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          points: parseInt(e.target.value) || 1,
                        }))
                      }
                      min="1"
                      max="10"
                      style={styles.input}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      onClick={handleAddQuestion}
                      style={styles.addQuestionButton}
                    >
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des questions */}
            {formData.questions.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={styles.questionItem}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={styles.questionNumber}>{idx + 1}</span>
                  <p style={styles.questionText}>{q.text}</p>
                  <span style={styles.questionPoints}>{q.points} pt</span>
                  <button
                    onClick={() => handleRemoveQuestion(idx)}
                    style={styles.removeQuestion}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bouton de création */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" /> Création...
              </>
            ) : (
              <>
                <Save size={20} /> Publier le quiz communautaire
              </>
            )}
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};

// Styles
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
    maxWidth: 800,
    margin: "0 auto",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 12,
    color: "#94a3b8",
    cursor: "pointer",
    marginBottom: 24,
  },
  card: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 24,
    padding: 32,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#f8fafc",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.8rem",
    marginBottom: 6,
  },
  labelSmall: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.7rem",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 10,
    color: "#f8fafc",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 10,
    color: "#f8fafc",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 10,
    color: "#f8fafc",
    outline: "none",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(99,102,241,0.2)",
    cursor: "pointer",
  },
  addQuestionCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  addOption: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 12px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    color: "#a5b4fc",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  removeOption: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },
  addQuestionButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "10px 16px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },
  questionItem: {
    padding: "12px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(99,102,241,0.1)",
    borderRadius: 10,
    marginBottom: 8,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#6366f1",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  questionText: {
    flex: 1,
    color: "#f8fafc",
  },
  questionPoints: {
    padding: "2px 8px",
    background: "rgba(245,158,11,0.1)",
    borderRadius: 12,
    color: "#f59e0b",
    fontSize: "0.7rem",
  },
  removeQuestion: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
};

export default CreateCommunityQuizPage;
