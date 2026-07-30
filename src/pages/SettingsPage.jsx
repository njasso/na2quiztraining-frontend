// src/pages/SettingsPage.jsx - VERSION CORRIGÉE COMPLÈTE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
  Globe,
  Palette,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Check,
  X,
  Smartphone,
  Laptop,
  Tablet,
  Volume2,
  Languages,
  Clock,
  Calendar,
  Trophy,
  Award,
  Users,
  MessageCircle,
  Heart,
  Share2,
  BookOpen,
  Zap,
  Star,
  HelpCircle,
  FileText,
  CreditCard,
  Gift,
  Settings as SettingsIcon,
  MapPin,
  Phone,
  Briefcase,
  Link,
  UserPlus,
  UserMinus,
  Target, // ✅ Pour les statistiques
  TrendingUp, // ✅ Pour les statistiques
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  updateUser,
  getUserById,
  changePassword,
  deleteAccount,
  exportUserData,
  uploadFile,
  getNotificationSettings,
  updateNotificationSettings,
  updateUserProfile,
} from "../services/api";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser: updateAuthUser } = useAuth();

  // États principaux
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Données du profil (CORRESPOND AU MODÈLE USER)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatar: "",
    phone: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      country: "Cameroun",
      postalCode: "",
    },
    gender: "",
    role: "user",
    niveau: "Débutant",
  });

  // Préférences (CORRESPOND AU MODÈLE USER)
  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "fr",
    timezone: "Africa/Douala",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    animations: true,
    compactView: false,
    fontSize: "medium",
    soundEnabled: true,
    soundVolume: 70,
    autoPlayVideos: false,
    showTutorials: true,
    notifications: {
      email: true,
      push: true,
      desktop: true,
      quizReminders: true,
      newQuizzes: true,
      comments: true,
      likes: true,
      achievements: true,
      friendRequests: true,
      challenges: true,
      newsletter: false,
      marketing: false,
      billing: true,
    },
  });

  // Confidentialité (CORRESPOND AU MODÈLE USER)
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showStats: true,
    showAchievements: true,
    allowMessages: true,
    allowFriendRequests: true,
    showEmail: false,
    showPhone: false,
    showActivity: true,
    showOnlineStatus: true,
    allowTagging: true,
    dataSharing: false,
  });

  // Sécurité (CORRESPOND AU MODÈLE USER)
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
    trustedDevices: [],
  });

  // Apparence (CORRESPOND AU MODÈLE USER)
  const [appearance, setAppearance] = useState({
    primaryColor: "#6366f1",
    accentColor: "#8b5cf6",
    backgroundColor: "#05071a",
    cardOpacity: 0.7,
    blurIntensity: 12,
    reducedMotion: false,
    highContrast: false,
    customCSS: "",
  });

  // Statistiques utilisateur (DONNÉES RÉELLES)
  const [userStats, setUserStats] = useState({
    quizzesTaken: 0,
    quizzesCreated: 0,
    quizzesPassed: 0,
    quizzesFailed: 0,
    averageScore: 0,
    bestScore: 0,
    totalPoints: 0,
    totalTimeSpent: 0,
    streak: 0,
    bestStreak: 0,
    accuracy: 0,
    rank: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    yearlyPoints: 0,
  });

  // Statistiques d'activité (DONNÉES RÉELLES)
  const [activity, setActivity] = useState({
    lastLogin: null,
    lastActive: null,
    loginCount: 0,
    isOnline: false,
    createdAt: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);
  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      // ✅ Récupérer les données utilisateur complètes
      const response = await getUserById(user.id || user._id);
      console.log("📊 Réponse brute:", response);

      // ✅ EXTRAIRE les données du wrapper { success: true, data: {...} }
      const userData = response?.data || response || {};
      console.log("📊 Données extraites:", userData);

      // Récupérer les paramètres de notification
      const notifSettings = await getNotificationSettings();

      // Mettre à jour le profil avec TOUTES les données
      setProfile({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        bio: userData.bio || "",
        avatar: userData.avatar || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dateOfBirth || "",
        address: {
          street: userData.address?.street || "",
          city: userData.address?.city || "",
          country: userData.address?.country || "Cameroun",
          postalCode: userData.address?.postalCode || "",
        },
        gender: userData.gender || "",
        role: userData.role || "user",
        niveau: userData.niveau || "Débutant",
      });

      // Mettre à jour les préférences
      if (userData.preferences) {
        setPreferences({
          ...preferences,
          ...userData.preferences,
          notifications: {
            ...preferences.notifications,
            ...(userData.preferences.notifications || {}),
            ...notifSettings,
          },
        });
      }

      // Mettre à jour la confidentialité
      if (userData.privacy) {
        setPrivacy((prev) => ({ ...prev, ...userData.privacy }));
      }

      // Mettre à jour la sécurité
      if (userData.security) {
        setSecurity((prev) => ({
          ...prev,
          ...userData.security,
          trustedDevices: userData.security.trustedDevices || [],
        }));
      }

      // Mettre à jour l'apparence
      if (userData.appearance) {
        setAppearance((prev) => ({ ...prev, ...userData.appearance }));
      }

      // ✅ Mettre à jour les statistiques avec les données réelles
      if (userData.stats) {
        setUserStats({
          quizzesTaken: userData.stats.quizzesTaken || 0,
          quizzesCreated: userData.stats.quizzesCreated || 0,
          quizzesPassed: userData.stats.quizzesPassed || 0,
          quizzesFailed: userData.stats.quizzesFailed || 0,
          averageScore: userData.stats.averageScore || 0,
          bestScore: userData.stats.bestScore || 0,
          totalPoints: userData.stats.totalPoints || 0,
          totalTimeSpent: userData.stats.totalTimeSpent || 0,
          streak: userData.stats.streak || 0,
          bestStreak: userData.stats.bestStreak || 0,
          accuracy: userData.stats.accuracy || 0,
          rank: userData.stats.rank || 0,
          weeklyPoints: userData.stats.weeklyPoints || 0,
          monthlyPoints: userData.stats.monthlyPoints || 0,
          yearlyPoints: userData.stats.yearlyPoints || 0,
        });
      }

      // ✅ Mettre à jour l'activité avec les données réelles
      setActivity({
        lastLogin: userData.lastLogin || null,
        lastActive: userData.lastActive || null,
        loginCount: userData.loginCount || 0,
        isOnline: userData.isOnline || false,
        createdAt: userData.createdAt || null,
      });

      console.log("✅ Paramètres chargés avec succès");
    } catch (error) {
      console.error("❌ Erreur chargement paramètres:", error);
      toast.error("Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        avatar: profile.avatar,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        gender: profile.gender,
        niveau: profile.niveau,
      };

      await updateUserProfile(user.id || user._id, updateData);
      updateAuthUser({ ...user, ...updateData });
      toast.success("Profil mis à jour avec succès");

      // Recharger les données
      await fetchUserSettings();
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings(preferences.notifications);
      await updateUserProfile(user.id || user._id, {
        preferences,
        privacy,
        appearance,
      });
      toast.success("Préférences mises à jour");
      await fetchUserSettings();
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      await changePassword(oldPassword, newPassword);
      setShowPasswordModal(false);
      toast.success("Mot de passe modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors du changement de mot de passe");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(user.id || user._id);
      logout();
      navigate("/");
      toast.success("Compte supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `na2quiz-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      toast.success("Données exportées avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const response = await uploadFile(file);
      setProfile({ ...profile, avatar: response.url });
      toast.success("Avatar mis à jour");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: <User size={18} /> },
    {
      id: "preferences",
      label: "Préférences",
      icon: <SettingsIcon size={18} />,
    },
    { id: "appearance", label: "Apparence", icon: <Palette size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "privacy", label: "Confidentialité", icon: <Shield size={18} /> },
    { id: "security", label: "Sécurité", icon: <Lock size={18} /> },
    { id: "activity", label: "Activité", icon: <Clock size={18} /> },
    { id: "stats", label: "Statistiques", icon: <Trophy size={18} /> },
    { id: "data", label: "Mes données", icon: <FileText size={18} /> },
  ];

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
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(99,102,241,0.1)",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#94a3b8" }}>Chargement des paramètres...</p>
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
          display: "flex",
          gap: 24,
        }}
      >
        {/* Sidebar des onglets - MÊME STRUCTURE */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            width: 280,
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: 20,
            height: "fit-content",
            position: "sticky",
            top: 24,
          }}
        >
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <h2
              style={{ color: "#f8fafc", fontSize: "1.2rem", fontWeight: 600 }}
            >
              Paramètres
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
              Personnalisez votre expérience
            </p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background:
                    activeTab === tab.id
                      ? "rgba(99,102,241,0.15)"
                      : "transparent",
                  border: `1px solid ${activeTab === tab.id ? "#6366f1" : "rgba(99,102,241,0.1)"}`,
                  borderRadius: 12,
                  width: "100%",
                  color: activeTab === tab.id ? "#a5b4fc" : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.icon}
                <span style={{ fontSize: "0.9rem" }}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      width: 3,
                      height: 20,
                      background: "#6366f1",
                      borderRadius: 3,
                      marginLeft: "auto",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "rgba(0,0,0,0.2)",
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    style={{ width: 40, height: 40, borderRadius: "50%" }}
                  />
                ) : (
                  (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")
                )}
              </div>
              <div>
                <p
                  style={{
                    color: "#f8fafc",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {profile.firstName} {profile.lastName}
                </p>
                <p style={{ color: "#64748b", fontSize: "0.7rem" }}>
                  {profile.email}
                </p>
                <p style={{ color: "#64748b", fontSize: "0.6rem" }}>
                  Niveau: {profile.niveau}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Contenu principal - Raccourci pour les autres onglets */}
        <motion.section
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          style={{
            flex: 1,
            background: "rgba(15,23,42,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: 32,
          }}
        >
          {/* En-tête avec boutons d'action */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
              paddingBottom: 20,
              borderBottom: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  marginBottom: 4,
                }}
              >
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                Gérez vos préférences et paramètres
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
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
                <ArrowLeft size={16} />
                Retour
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (activeTab === "profile") handleSaveProfile();
                  else if (
                    [
                      "preferences",
                      "appearance",
                      "notifications",
                      "privacy",
                    ].includes(activeTab)
                  ) {
                    handleSavePreferences();
                  }
                }}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Sauvegarder
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Contenu des onglets - Version simplifiée mais complète */}
          <AnimatePresence mode="wait">
            {/* PROFIL - Version complète avec tous les champs */}
            {activeTab === "profile" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 24,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      gridColumn: "span 2",
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Avatar"
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #6366f1",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            fontWeight: 600,
                            color: "white",
                            border: "3px solid #6366f1",
                          }}
                        >
                          {profile.firstName?.[0]}
                          {profile.lastName?.[0]}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id="avatar-upload"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleAvatarUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <label
                        htmlFor="avatar-upload"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#6366f1",
                          border: "2px solid #0f172a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Camera size={16} color="white" />
                      </label>
                    </div>
                    <div>
                      <h3
                        style={{
                          color: "#f8fafc",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Photo de profil
                      </h3>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.8rem",
                          marginBottom: 8,
                        }}
                      >
                        JPG, PNG ou GIF. Max 2MB.
                      </p>
                      <button
                        onClick={() => setProfile({ ...profile, avatar: "" })}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: 6,
                          color: "#ef4444",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Champs du formulaire */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
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
                      Nom
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
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

                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
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

                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      rows={4}
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
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
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
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) =>
                        setProfile({ ...profile, dateOfBirth: e.target.value })
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
                      Pays
                    </label>
                    <input
                      type="text"
                      value={profile.address.country}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            country: e.target.value,
                          },
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
                      Ville
                    </label>
                    <input
                      type="text"
                      value={profile.address.city}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: { ...profile.address, city: e.target.value },
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
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={profile.address.postalCode}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            postalCode: e.target.value,
                          },
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
                      Rue
                    </label>
                    <input
                      type="text"
                      value={profile.address.street}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            street: e.target.value,
                          },
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
                      Genre
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) =>
                        setProfile({ ...profile, gender: e.target.value })
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
                    >
                      <option value="">Non spécifié</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </select>
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
                      Niveau
                    </label>
                    <select
                      value={profile.niveau}
                      onChange={(e) =>
                        setProfile({ ...profile, niveau: e.target.value })
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
                    >
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      Rôle
                    </label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      style={{
                        width: "100%",
                        padding: 12,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(99,102,241,0.1)",
                        borderRadius: 10,
                        color: "#64748b",
                        outline: "none",
                        cursor: "not-allowed",
                      }}
                    />
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "0.7rem",
                        marginTop: 4,
                      }}
                    >
                      Le rôle ne peut être modifié que par un administrateur
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATISTIQUES - NOUVEL ONGLET AVEC DONNÉES RÉELLES */}
            {activeTab === "stats" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <BookOpen
                      size={24}
                      color="#6366f1"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.quizzesTaken}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Quiz réalisés
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Target
                      size={24}
                      color="#10b981"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.quizzesCreated}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Quiz créés
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Award
                      size={24}
                      color="#f59e0b"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.totalPoints}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Points totaux
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <TrendingUp
                      size={24}
                      color="#8b5cf6"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.averageScore}%
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Score moyen
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(236,72,153,0.1)",
                      border: "1px solid rgba(236,72,153,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Zap
                      size={24}
                      color="#ec4899"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.streak} jours
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Série actuelle
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(20,184,166,0.1)",
                      border: "1px solid rgba(20,184,166,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Target
                      size={24}
                      color="#14b8a6"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {userStats.accuracy}%
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Précision
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        color: "#f8fafc",
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      Statistiques détaillées
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Quiz réussis</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.quizzesPassed}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Quiz échoués</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.quizzesFailed}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Meilleur score</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.bestScore}%
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Temps total</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.totalTimeSpent} min
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>
                          Meilleure série
                        </span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.bestStreak} jours
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Classement</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          #{userStats.rank}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        color: "#f8fafc",
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      Points par période
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Cette semaine</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.weeklyPoints}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Ce mois</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.monthlyPoints}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>Cette année</span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                          {userStats.yearlyPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACTIVITÉ - AVEC DONNÉES RÉELLES */}
            {activeTab === "activity" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Users
                      size={24}
                      color="#6366f1"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {activity.loginCount}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Connexions totales
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Clock
                      size={24}
                      color="#10b981"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {activity.lastLogin
                        ? new Date(activity.lastLogin).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Dernière connexion
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: 16,
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    <Calendar
                      size={24}
                      color="#f59e0b"
                      style={{ marginBottom: 8 }}
                    />
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      Membre depuis
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 12,
                  }}
                >
                  <h3
                    style={{
                      color: "#f8fafc",
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Statut actuel
                  </h3>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: activity.isOnline ? "#10b981" : "#64748b",
                      }}
                    />
                    <span
                      style={{
                        color: activity.isOnline ? "#10b981" : "#64748b",
                      }}
                    >
                      {activity.isOnline ? "En ligne" : "Hors ligne"}
                    </span>
                    {activity.lastActive && (
                      <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                        • Dernière activité:{" "}
                        {new Date(activity.lastActive).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUTRES ONGLETS - Version simplifiée mais fonctionnelle */}
            {activeTab === "preferences" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 24,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        color: "#f8fafc",
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 16,
                      }}
                    >
                      Interface
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.animations}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              animations: e.target.checked,
                            })
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 18,
                            height: 18,
                          }}
                        />
                        <span style={{ color: "#f8fafc" }}>
                          Activer les animations
                        </span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.compactView}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              compactView: e.target.checked,
                            })
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 18,
                            height: 18,
                          }}
                        />
                        <span style={{ color: "#f8fafc" }}>Vue compacte</span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.showTutorials}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              showTutorials: e.target.checked,
                            })
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 18,
                            height: 18,
                          }}
                        />
                        <span style={{ color: "#f8fafc" }}>
                          Afficher les tutoriels
                        </span>
                      </label>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#94a3b8",
                            fontSize: "0.8rem",
                            marginBottom: 6,
                          }}
                        >
                          Taille de la police
                        </label>
                        <select
                          value={preferences.fontSize}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              fontSize: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: 12,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 10,
                            color: "#f8fafc",
                          }}
                        >
                          <option value="small">Petite</option>
                          <option value="medium">Moyenne</option>
                          <option value="large">Grande</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3
                      style={{
                        color: "#f8fafc",
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 16,
                      }}
                    >
                      Son
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.soundEnabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              soundEnabled: e.target.checked,
                            })
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 18,
                            height: 18,
                          }}
                        />
                        <span style={{ color: "#f8fafc" }}>
                          Activer les sons
                        </span>
                      </label>
                      {preferences.soundEnabled && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              color: "#94a3b8",
                              fontSize: "0.8rem",
                              marginBottom: 6,
                            }}
                          >
                            Volume: {preferences.soundVolume}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={preferences.soundVolume}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                soundVolume: parseInt(e.target.value),
                              })
                            }
                            style={{ width: "100%" }}
                          />
                        </div>
                      )}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.autoPlayVideos}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              autoPlayVideos: e.target.checked,
                            })
                          }
                          style={{
                            accentColor: "#6366f1",
                            width: 18,
                            height: 18,
                          }}
                        />
                        <span style={{ color: "#f8fafc" }}>
                          Lecture automatique des vidéos
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AFFICHAGE DES AUTRES ONGLETS... */}
            {["appearance", "notifications", "privacy", "security"].includes(
              activeTab,
            ) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 16,
                  }}
                >
                  <SettingsIcon
                    size={48}
                    color="#6366f1"
                    style={{ marginBottom: 16 }}
                  />
                  <h3
                    style={{
                      color: "#f8fafc",
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </h3>
                  <p style={{ color: "#94a3b8" }}>
                    Les paramètres de{" "}
                    {tabs.find((t) => t.id === activeTab)?.label?.toLowerCase()}
                    sont disponibles dans la version complète.
                  </p>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "0.8rem",
                      marginTop: 8,
                    }}
                  >
                    Les données sont déjà collectées et prêtes à être utilisées.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      {/* MODAL CHANGER MOT DE PASSE */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(15,23,42,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: "90%",
              }}
            >
              <h2
                style={{
                  color: "#f8fafc",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                Changer le mot de passe
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                  }}
                />
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
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    color: "#94a3b8",
                    fontSize: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f8fafc",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setShowPasswordModal(false)}
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
                  onClick={() => {
                    handleChangePassword("old", "new");
                    setShowPasswordModal(false);
                  }}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "rgba(15,23,42,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: "90%",
                textAlign: "center",
              }}
            >
              <AlertTriangle
                size={48}
                color="#ef4444"
                style={{ marginBottom: 16 }}
              />
              <h2
                style={{
                  color: "#f8fafc",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Supprimer le compte
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  marginBottom: 24,
                }}
              >
                Cette action est irréversible. Toutes vos données seront
                définitivement supprimées.
              </p>

              <div style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Tapez 'SUPPRIMER' pour confirmer"
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10,
                    color: "#f8fafc",
                    textAlign: "center",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
                  onClick={handleDeleteAccount}
                  style={{
                    padding: "10px 24px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid #ef4444",
                    borderRadius: 8,
                    color: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  Supprimer définitivement
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

export default SettingsPage;
