// src/pages/StartQuizPage.jsx — Version corrigée
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  ArrowLeft,
  Clock,
  User,
  BookOpen,
  Layers,
  ChevronRight,
  Camera,
  Database,
} from "lucide-react";
import DOMAIN_DATA, {
  getAllDomaines,
  getAllSousDomaines,
  getAllLevels,
  getAllMatieres,
} from "../data/domainConfig";
import { getQuestions } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  hasEducationScope,
  isScopeExemptRole,
  getVisibleSousDomaines,
  getVisibleLevels,
  getAllowedMatieres,
  formatScopeLabel,
} from "../utils/educationScope";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const StartQuizPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // 🔒 Un élève standard ne doit voir que son propre niveau (voir rapport
  // d'audit) : domaine/sous-domaine/niveau sont pré-remplis et verrouillés,
  // seule la matière reste un choix libre parmi celles autorisées.
  const scopeLocked = hasEducationScope(user) && !isScopeExemptRole(user);
  const savedProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  const [formData, setFormData] = useState({
    firstName: savedProfile.firstName || user?.firstName || "",
    lastName: savedProfile.lastName || user?.lastName || "",
    avatar: savedProfile.avatar || "",
    domaine: scopeLocked ? user.education.domainId : "",
    sousDomaine: scopeLocked ? user.education.sousDomaineId : "",
    niveau: scopeLocked ? user.education.levelId : "",
    matiere: "",
    duration: 10,
    questionCount: 10,
  });

  // ✅ Utiliser les fonctions utilitaires de domainConfig
  const [availableOptions, setAvailableOptions] = useState({
    domaines: [],
    sousDomaines: [],
    niveaux: [],
    matieres: [],
  });

  const [avatarPreview, setAvatarPreview] = useState(savedProfile.avatar || "");
  const [loading, setLoading] = useState(false);
  const [availableQuestionCount, setAvailableQuestionCount] = useState(0);

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.domaine &&
    formData.sousDomaine &&
    formData.niveau &&
    formData.matiere;

  // ✅ Charger les domaines au montage
  useEffect(() => {
    const domaines = getAllDomaines();
    setAvailableOptions((prev) => ({ ...prev, domaines }));
  }, []);

  // ✅ Mettre à jour les sous-domaines quand le domaine change (restreint au
  // périmètre de l'utilisateur — voir educationScope.js)
  useEffect(() => {
    if (!formData.domaine) {
      setAvailableOptions((prev) => ({
        ...prev,
        sousDomaines: [],
        niveaux: [],
        matieres: [],
      }));
      return;
    }

    const sousDomaines = getVisibleSousDomaines(user, formData.domaine);
    setAvailableOptions((prev) => ({
      ...prev,
      sousDomaines,
      niveaux: scopeLocked ? prev.niveaux : [],
      matieres: scopeLocked ? prev.matieres : [],
    }));
    if (!scopeLocked) {
      setFormData((prev) => ({
        ...prev,
        sousDomaine: "",
        niveau: "",
        matiere: "",
      }));
    }
  }, [formData.domaine]);

  // ✅ Mettre à jour les niveaux quand le sous-domaine change (restreint)
  useEffect(() => {
    if (!formData.domaine || !formData.sousDomaine) {
      setAvailableOptions((prev) => ({ ...prev, niveaux: [], matieres: [] }));
      return;
    }

    const niveaux = getVisibleLevels(user, formData.domaine, formData.sousDomaine);
    setAvailableOptions((prev) => ({ ...prev, niveaux, matieres: scopeLocked ? prev.matieres : [] }));
    if (!scopeLocked) {
      setFormData((prev) => ({ ...prev, niveau: "", matiere: "" }));
    }
  }, [formData.domaine, formData.sousDomaine]);

  // ✅ Mettre à jour les matières quand le niveau change (matières
  // autorisées uniquement — voir getAllowedMatieres)
  useEffect(() => {
    if (!formData.domaine || !formData.sousDomaine) {
      setAvailableOptions((prev) => ({ ...prev, matieres: [] }));
      return;
    }

    const matieres = getAllowedMatieres(user, formData.domaine, formData.sousDomaine);
    setAvailableOptions((prev) => ({ ...prev, matieres }));
    setFormData((prev) => ({ ...prev, matiere: "" }));
  }, [formData.domaine, formData.sousDomaine]);

  // Vérifier le nombre de questions disponibles
  useEffect(() => {
    const checkAvailableQuestions = async () => {
      if (
        !formData.domaine ||
        !formData.sousDomaine ||
        !formData.niveau ||
        !formData.matiere
      ) {
        setAvailableQuestionCount(0);
        return;
      }

      try {
        const response = await getQuestions({
          domaine: formData.domaine,
          sousDomaine: formData.sousDomaine,
          niveau: formData.niveau,
          matiere: formData.matiere,
          limit: 1000,
        });

        let questions = [];
        if (Array.isArray(response)) {
          questions = response;
        } else if (response?.data && Array.isArray(response.data)) {
          questions = response.data;
        } else if (response?.questions && Array.isArray(response.questions)) {
          questions = response.questions;
        }

        setAvailableQuestionCount(questions.length);

        if (questions.length === 0) {
          toast.error(`Aucune question trouvée pour ${formData.matiere}`, {
            icon: "📚",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des questions:", error);
        setAvailableQuestionCount(0);
      }
    };

    checkAvailableQuestions();
  }, [
    formData.domaine,
    formData.sousDomaine,
    formData.niveau,
    formData.matiere,
  ]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarData = reader.result;
      setFormData((prev) => ({ ...prev, avatar: avatarData }));
      setAvatarPreview(avatarData);
    };
    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  };

  const fetchQuestionsFromAPI = async () => {
    setLoading(true);
    try {
      console.log("🔍 Recherche de questions pour:", {
        domaine: formData.domaine,
        sousDomaine: formData.sousDomaine,
        niveau: formData.niveau,
        matiere: formData.matiere,
      });

      const response = await getQuestions({
        domaine: formData.domaine,
        sousDomaine: formData.sousDomaine,
        niveau: formData.niveau,
        matiere: formData.matiere,
        limit: formData.questionCount,
      });

      let questions = [];
      if (Array.isArray(response)) {
        questions = response;
      } else if (response?.data && Array.isArray(response.data)) {
        questions = response.data;
      } else if (response?.questions && Array.isArray(response.questions)) {
        questions = response.questions;
      }

      console.log(`📦 ${questions.length} questions récupérées`);

      if (questions.length === 0) {
        toast.error(
          `Aucune question trouvée pour ${formData.matiere} au niveau ${formData.niveau}`,
          {
            duration: 5000,
          },
        );
        setLoading(false);
        return;
      }

      // ✅ Normaliser les questions pour le format attendu par QuizPage
      const normalizedQuestions = questions.map((q, index) => ({
        id: q._id || q.id || index,
        text: q.question || q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.answer,
        points: q.points || 1,
        explanation: q.explanation || "",
        type: q.type || "single",
      }));

      // Sauvegarder le profil
      const userProfile = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatar,
      };
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // Naviguer vers la page du quiz
      navigate("/quiz", {
        state: {
          userInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            avatar: formData.avatar,
          },
          quizQuestions: normalizedQuestions,
          domaine: formData.domaine,
          sousDomaine: formData.sousDomaine,
          niveau: formData.niveau,
          matiere: formData.matiere,
          duration: formData.duration * 60,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des questions:", error);
      toast.error("Erreur lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // 🔒 Garde anti-contournement : la sélection doit rester dans le
    // périmètre de l'utilisateur même si le formulaire a été manipulé.
    if (scopeLocked) {
      const stillAllowed =
        String(formData.domaine) === String(user.education.domainId) &&
        String(formData.sousDomaine) === String(user.education.sousDomaineId) &&
        String(formData.niveau) === String(user.education.levelId);
      if (!stillAllowed) {
        toast.error("Cette sélection ne correspond pas à votre niveau d'étude.");
        return;
      }
    }

    if (availableQuestionCount === 0) {
      toast.error(
        `Aucune question disponible pour ${formData.matiere}. Veuillez choisir une autre matière.`,
      );
      return;
    }

    fetchQuestionsFromAPI();
  };

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
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            marginBottom: 24,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 10,
            color: "#94a3b8",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} />
          Retour
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: 32,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              <Database size={14} color="#6366f1" />
              <span style={{ color: "#a5b4fc", fontSize: "0.8rem" }}>
                BASE DE DONNÉES
              </span>
            </div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: 8,
              }}
            >
              Personnalisez votre quiz
            </h1>
            <p style={{ color: "#94a3b8" }}>
              Choisissez vos préférences pour commencer
            </p>
          </div>

          <form onSubmit={startQuiz}>
            {/* Informations personnelles */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: 20,
                }}
              >
                <User size={18} color="#6366f1" />
                Vos informations
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                    }}
                  >
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
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
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                    }}
                  >
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
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
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Avatar avec preview */}
              <div>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Avatar (optionnel)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative" }}>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #6366f1",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          background: "rgba(99,102,241,0.2)",
                          border: "2px dashed #6366f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6366f1",
                        }}
                      >
                        <Camera size={24} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 10,
                      color: "#94a3b8",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Configuration du quiz */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: 20,
                }}
              >
                <BookOpen size={18} color="#6366f1" />
                Configuration du quiz
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                    }}
                  >
                    Domaine *
                  </label>
                  <select
                    value={formData.domaine}
                    onChange={(e) =>
                      setFormData({ ...formData, domaine: e.target.value })
                    }
                    disabled={scopeLocked}
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 10,
                      color: "#f8fafc",
                      outline: "none",
                      opacity: scopeLocked ? 0.6 : 1,
                    }}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {availableOptions.domaines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.domaine && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Catégorie *
                    </label>
                    <select
                      value={formData.sousDomaine}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sousDomaine: e.target.value,
                        })
                      }
                      disabled={scopeLocked}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: 10,
                        color: "#f8fafc",
                        outline: "none",
                        opacity: scopeLocked ? 0.6 : 1,
                      }}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {availableOptions.sousDomaines.map((sd) => (
                        <option key={sd.id} value={sd.id}>
                          {sd.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                {formData.sousDomaine && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Niveau *
                    </label>
                    <select
                      value={formData.niveau}
                      onChange={(e) =>
                        setFormData({ ...formData, niveau: e.target.value })
                      }
                      disabled={scopeLocked}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: 10,
                        color: "#f8fafc",
                        outline: "none",
                        opacity: scopeLocked ? 0.6 : 1,
                      }}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {availableOptions.niveaux.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.niveau && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Matière *
                    </label>
                    <select
                      value={formData.matiere}
                      onChange={(e) =>
                        setFormData({ ...formData, matiere: e.target.value })
                      }
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
                    >
                      <option value="">Sélectionner...</option>
                      {availableOptions.matieres.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Information sur les questions disponibles */}
              {formData.matiere && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background:
                      availableQuestionCount > 0
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(239,68,68,0.1)",
                    border: `1px solid ${availableQuestionCount > 0 ? "#10b981" : "#ef4444"}`,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Database
                    size={16}
                    color={availableQuestionCount > 0 ? "#10b981" : "#ef4444"}
                  />
                  <span
                    style={{
                      color: availableQuestionCount > 0 ? "#10b981" : "#ef4444",
                      fontSize: "0.85rem",
                    }}
                  >
                    {availableQuestionCount > 0
                      ? `${availableQuestionCount} questions disponibles dans la base`
                      : `Aucune question trouvée pour ${formData.matiere}`}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                    }}
                  >
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 1,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 10,
                      color: "#f8fafc",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                    }}
                  >
                    Nombre de questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={availableQuestionCount || 50}
                    value={formData.questionCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        questionCount: Math.min(
                          parseInt(e.target.value) || 1,
                          availableQuestionCount || 50,
                        ),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 10,
                      color: "#f8fafc",
                      outline: "none",
                    }}
                    disabled={availableQuestionCount === 0}
                  />
                  {availableQuestionCount > 0 && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        marginTop: 4,
                      }}
                    >
                      Max: {availableQuestionCount} questions disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={!isFormValid || availableQuestionCount === 0 || loading}
              whileHover={{
                scale:
                  isFormValid && availableQuestionCount > 0 && !loading
                    ? 1.02
                    : 1,
              }}
              whileTap={{
                scale:
                  isFormValid && availableQuestionCount > 0 && !loading
                    ? 0.98
                    : 1,
              }}
              style={{
                width: "100%",
                padding: 16,
                background:
                  isFormValid && availableQuestionCount > 0 && !loading
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(99,102,241,0.3)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor:
                  isFormValid && availableQuestionCount > 0 && !loading
                    ? "pointer"
                    : "not-allowed",
                boxShadow:
                  isFormValid && availableQuestionCount > 0 && !loading
                    ? "0 8px 20px rgba(99,102,241,0.3)"
                    : "none",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Chargement...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Démarrer le quiz
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StartQuizPage;
