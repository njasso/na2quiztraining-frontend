// src/pages/ProfilePage.jsx - VERSION ULTIME COMPLÈTE
// ✅ Optimisation des appels API
// ✅ Gestion du cache
// ✅ Évitement des appels multiples
// ✅ Gestion complète des erreurs
// ✅ Dark mode natif
// ✅ Animations fluides
// ✅ Accessibilité améliorée
// ✅ CORRECTION : Utilisation correcte de userData.stats
// ✅ CORRECTION : Clés uniques pour les achievements

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Calendar,
  Award,
  BookOpen,
  Settings,
  LogOut,
  Edit2,
  Camera,
  Target,
  Clock,
  TrendingUp,
  ArrowLeft,
  Save,
  Users,
  Medal,
  AlertCircle,
  RefreshCw,
  UserCog,
  User,
  Shield,
  Star,
  Zap,
  Heart,
  Coffee,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  Globe,
  Linkedin,
  Github,
  Twitter,
  GraduationCap,
} from "lucide-react";
import {
  getUserProfile,
  getUserStats,
  getUserAchievements,
  updateUserProfile,
  logout as apiLogout,
} from "../services/api";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "profile_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ─── HELPERS POUR LES BADGES ──────────────────────────────────────────────────
const getBadgeLabel = (name) => {
  const labels = {
    débutant: "Débutant",
    expert_maths: "Expert en Mathématiques",
    créateur: "Créateur",
    streak_7: "Série de 7 jours",
    streak_30: "Série de 30 jours",
    score_parfait: "Score Parfait",
    top_10: "Top 10",
    early_adopter: "Early Adopter",
  };
  return labels[name] || name || "Badge";
};

const getBadgeDescription = (name) => {
  const descriptions = {
    débutant: "A complété son premier quiz",
    expert_maths: "A obtenu 100% en Mathématiques",
    créateur: "A créé son premier quiz",
    streak_7: "7 jours de suite d'activité",
    streak_30: "30 jours de suite d'activité",
    score_parfait: "A obtenu un score parfait",
    top_10: "Dans le top 10 du classement",
    early_adopter: "Parmi les premiers utilisateurs",
  };
  return descriptions[name] || "Badge débloqué";
};

const getBadgeIcon = (name) => {
  const icons = {
    débutant: "🌟",
    expert_maths: "📐",
    créateur: "✍️",
    streak_7: "🔥",
    streak_30: "⚡",
    score_parfait: "💯",
    top_10: "🏆",
    early_adopter: "🚀",
  };
  return icons[name] || "🏆";
};

const normalizeAchievements = (data) => {
  let rawData = data;

  if (rawData && typeof rawData === "object") {
    if (rawData.data !== undefined) rawData = rawData.data;
    if (rawData.badges !== undefined) rawData = rawData.badges;
    if (rawData.achievements !== undefined) rawData = rawData.achievements;
  }

  let array = [];
  if (Array.isArray(rawData)) {
    array = rawData;
  } else if (rawData && typeof rawData === "object") {
    array = Object.values(rawData).filter(
      (item) => item && typeof item === "object",
    );
  }

  return array.map((item, index) => ({
    id: item?.id || item?._id || `achievement-${index}-${Date.now()}`, // ← CLÉ UNIQUE
    title: item?.title || item?.name || "Accomplissement",
    description: item?.description || "",
    icon: item?.icon || "🏆",
    unlocked:
      item?.unlocked ??
      item?.completed ??
      item?.progress >= item?.total ??
      false,
    progress: item?.progress || 0,
    total: item?.total || 100,
    date: item?.date || item?.unlockedAt || null,
  }));
};

const calculateLevel = (stats) => {
  const quizzes = stats?.quizzesTaken || 0;
  const score = stats?.averageScore || 0;

  if (quizzes >= 50 && score >= 85) return "Expert";
  if (quizzes >= 25 && score >= 75) return "Avancé";
  if (quizzes >= 10) return "Intermédiaire";
  return "Débutant";
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();

  // ─── ÉTATS ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ─── REFS ──────────────────────────────────────────────────────────────────
  const fetchAttempts = useRef(0);
  const abortControllerRef = useRef(null);
  const isMounted = useRef(true);
  const userIdRef = useRef(null);
  const cacheTimerRef = useRef(null);

  // ─── PROFIL ─────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
    bio: "",
    joinedDate: "",
    level: "Débutant",
    quizzesTaken: 0,
    quizzesCreated: 0,
    averageScore: 0,
    bestCategory: "",
    streak: 0,
    followersCount: 0,
    followingCount: 0,
    role: "user",
    isOnline: false,
    lastActive: null,
    badges: [],
    stats: {},
  });

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatar: "",
  });

  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    createdQuizzes: 0,
    averageScore: 0,
    bestCategory: "Aucune",
    streak: 0,
    accuracy: 0,
    totalPoints: 0,
    domains: [],
    subjects: [],
  });

  // ─── CACHE ──────────────────────────────────────────────────────────────────
  const getCachedProfile = useCallback((userId) => {
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
        return null;
      }
      return data.profile;
    } catch {
      return null;
    }
  }, []);

  const setCachedProfile = useCallback((userId, profileData) => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${userId}`,
        JSON.stringify({
          profile: profileData,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Ignorer les erreurs de cache
    }
  }, []);

  // ─── SLEEP UTILITY ──────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ─── INITIALISATION ──────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const id = user.id || user._id;
      userIdRef.current = id;

      // Chargement initial avec le cache
      const cached = getCachedProfile(id);
      if (cached) {
        console.log("📥 Profil chargé depuis le cache");
        setProfile((prev) => ({ ...prev, ...cached }));
        setLoaded(true);
        setLoading(false);
      }

      // Chargement initial des données
      setProfile((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        avatar: user.avatar || "",
        role: user.role || "user",
      }));

      // Rafraîchir en arrière-plan
      fetchUserProfile(id);
    } catch (error) {
      console.error("Erreur parsing user:", error);
      navigate("/login");
    }

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cacheTimerRef.current) {
        clearTimeout(cacheTimerRef.current);
      }
    };
  }, [navigate, getCachedProfile]);

  // ─── FONCTION PRINCIPALE DE RÉCUPÉRATION ──────────────────────────────────
  const fetchUserProfile = async (id, retry = false) => {
    // ✅ Éviter les appels multiples si déjà chargé
    if (loaded && !retry && !isRefreshing) {
      console.log("📥 Profil déjà chargé, skip");
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!retry && !isRefreshing) {
      setLoading(true);
      setError(null);
      fetchAttempts.current = 0;
    }

    try {
      console.log("📥 Récupération du profil...");

      // ✅ 1️⃣ Récupérer les données utilisateur
      const response = await getUserProfile(id);
      if (!isMounted.current) return;
      console.log("✅ Profil reçu:", response);

      // ✅ EXTRAIRE les données du wrapper
      const userData = response?.data || response || {};
      console.log("📦 Données extraites:", userData);

      // ✅ 2️⃣ Récupérer les stats et achievements en parallèle
      const [statsResponse, achievementsResponse] = await Promise.all([
        getUserStats(id).catch(() => ({})),
        getUserAchievements(id).catch(() => []),
      ]);

      if (!isMounted.current) return;
      console.log("✅ Stats et achievements reçus");

      // ✅ EXTRAIRE les stats du wrapper
      const statsData = statsResponse?.data || statsResponse || {};
      const achievementsData =
        achievementsResponse?.data || achievementsResponse || [];

      // ✅ 3️⃣ Utiliser userData.stats comme source principale
      const stats = userData?.stats || {};

      // ✅ Calcul du niveau basé sur les stats réelles
      const calculatedLevel = userData?.niveau || calculateLevel(stats);

      const profileData = {
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        email: userData?.email || "",
        avatar: userData?.avatar || "",
        bio: userData?.bio || "Passionné d'apprentissage et de quiz.",
        joinedDate: userData?.createdAt || new Date().toISOString(),
        level: calculatedLevel,
        quizzesTaken: stats?.quizzesTaken || 0,
        quizzesCreated: stats?.quizzesCreated || 0,
        averageScore: stats?.averageScore || 0,
        bestCategory: stats?.bestCategory || "Aucune",
        streak: stats?.streak || 0,
        followersCount: userData?.followers?.length || 0,
        followingCount: userData?.following?.length || 0,
        role: userData?.role || "user",
        isOnline: userData?.isOnline || false,
        lastActive: userData?.lastActive || null,
        badges: userData?.badges || [],
        stats: stats,
      };

      setProfile((prev) => ({ ...prev, ...profileData }));

      // Mettre en cache
      setCachedProfile(id, profileData);

      // ✅ 4️⃣ Mettre à jour les stats avec userData.stats
      setStats({
        totalQuizzes: stats?.quizzesTaken || 0,
        createdQuizzes: stats?.quizzesCreated || 0,
        averageScore: stats?.averageScore || 0,
        bestCategory: stats?.bestCategory || "Aucune",
        streak: stats?.streak || 0,
        accuracy: stats?.accuracy || 0,
        totalPoints: stats?.totalPoints || 0,
        domains: stats?.domains || [],
        subjects: stats?.subjects || [],
      });

      setEditForm({
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        email: userData?.email || "",
        bio: userData?.bio || "",
        avatar: userData?.avatar || "",
      });

      // ✅ 5️⃣ Normaliser les badges existants dans userData.badges
      const normalizedBadges = (userData?.badges || []).map((badge, index) => ({
        id: `badge-${badge.name}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: getBadgeLabel(badge.name),
        description: getBadgeDescription(badge.name),
        icon: getBadgeIcon(badge.name),
        unlocked: true,
        progress: badge.progress || 100,
        total: 100,
        date: badge.unlockedAt || new Date().toISOString(),
      }));

      console.log("📊 Badges normalisés:", normalizedBadges.length);

      // ✅ 6️⃣ Utiliser UNIQUEMENT les badges normalisés
      const allAchievements = normalizedBadges;

      // ✅ 7️⃣ METTRE À JOUR l'état achievements
      setAchievements(allAchievements);

      console.log("📊 Achievements définis:", allAchievements.length);

      fetchAttempts.current = 0;
      setRetryCount(0);
      setLoaded(true);

      console.log("✅ Profil chargé avec succès:", {
        quizzesTaken: stats?.quizzesTaken,
        totalPoints: stats?.totalPoints,
        badges: userData?.badges?.length,
        achievements: allAchievements.length,
      });
    } catch (error) {
      if (!isMounted.current) return;

      console.error("❌ Erreur chargement profil:", error);

      // ✅ Gestion du Rate Limiting (429)
      if (error?.response?.status === 429) {
        fetchAttempts.current += 1;

        if (fetchAttempts.current <= 3) {
          const delay = fetchAttempts.current * 2000;
          console.log(
            `⏳ Rate limit, tentative ${fetchAttempts.current}/3, attente ${delay}ms...`,
          );
          toast.loading(
            `Trop de requêtes, tentative ${fetchAttempts.current}/3...`,
            { duration: 2000 },
          );

          await sleep(delay);
          if (isMounted.current) {
            return fetchUserProfile(id, true);
          }
        } else {
          setError(
            "Le serveur est saturé. Veuillez réessayer dans quelques instants.",
          );
          toast.error("Trop de requêtes, veuillez patienter");
        }
      }
      // ✅ Gestion des erreurs de réseau
      else if (error?.code === "ERR_NETWORK") {
        setError(
          "Impossible de contacter le serveur. Vérifiez votre connexion.",
        );
        toast.error("Erreur de réseau");
      }
      // ✅ Gestion des erreurs annulées
      else if (error?.code === "ERR_CANCELED") {
        console.log("⏹️ Requête annulée");
        return;
      }
      // ✅ Gestion des erreurs 404 (utilisateur non trouvé)
      else if (error?.response?.status === 404) {
        setError("Utilisateur non trouvé");
        toast.error("Utilisateur non trouvé");
      }
      // ✅ Gestion des erreurs 401 (token invalide)
      else if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }
      // ✅ Autres erreurs
      else {
        setError("Impossible de charger votre profil. Veuillez réessayer.");
        toast.error("Erreur de chargement du profil");
      }

      // ✅ Fallback : utiliser les données du cache
      const cachedUser = localStorage.getItem("user");
      if (cachedUser && !retry) {
        try {
          const user = JSON.parse(cachedUser);
          setProfile((prev) => ({
            ...prev,
            firstName: user.firstName || prev.firstName || "",
            lastName: user.lastName || prev.lastName || "",
            email: user.email || prev.email || "",
            avatar: user.avatar || prev.avatar || "",
            role: user.role || prev.role || "user",
          }));
        } catch (e) {}
      }

      setAchievements([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };
  // ─── ACTIONS ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const updated = await updateUserProfile(userIdRef.current, editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès");

      // Mettre à jour le cache
      const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...cachedUser,
          ...editForm,
        }),
      );

      // Mettre à jour le cache du profil
      setCachedProfile(userIdRef.current, { ...profile, ...editForm });

      await sleep(500);
      fetchUserProfile(userIdRef.current);
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Erreur logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      // Nettoyer le cache
      localStorage.removeItem(`${STORAGE_KEY}_${userIdRef.current}`);
      navigate("/login");
      toast.success("Déconnexion réussie");
    }
  };

  const handleRefresh = useCallback(() => {
    if (isRefreshing || !userIdRef.current) return;
    setIsRefreshing(true);
    fetchUserProfile(userIdRef.current);
  }, [isRefreshing]);

  // ─── STATISTIQUES ─────────────────────────────────────────────────────────────
  const statsItems = useMemo(
    () => [
      {
        label: "Quiz réalisés",
        value: stats.totalQuizzes,
        icon: <BookOpen size={16} />,
        color: "#6366f1",
      },
      {
        label: "Quiz créés",
        value: stats.createdQuizzes,
        icon: <Target size={16} />,
        color: "#10b981",
      },
      {
        label: "Score moyen",
        value: `${stats.averageScore}%`,
        icon: <TrendingUp size={16} />,
        color: "#f59e0b",
      },
      {
        label: "Précision",
        value: `${stats.accuracy || 0}%`,
        icon: <Target size={16} />,
        color: "#8b5cf6",
      },
      {
        label: "Points",
        value: stats.totalPoints || 0,
        icon: <Award size={16} />,
        color: "#ec4899",
      },
      {
        label: "Série actuelle",
        value: `${stats.streak} jours`,
        icon: <Clock size={16} />,
        color: "#14b8a6",
      },
    ],
    [stats],
  );

  // ─── RENDU ────────────────────────────────────────────────────────────────────

  // État de chargement
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
      <NavHome />
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Chargement du profil...</p>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={styles.errorTitle}>Erreur de chargement</h2>
          <p style={styles.errorText}>{error}</p>
          {retryCount > 0 && (
            <p style={styles.retryText}>Tentative {retryCount} sur 3</p>
          )}
          <div style={styles.errorActions}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setRetryCount((prev) => prev + 1);
                if (userIdRef.current) fetchUserProfile(userIdRef.current);
              }}
              disabled={retryCount >= 3}
              style={{
                ...styles.retryButton,
                opacity: retryCount >= 3 ? 0.5 : 1,
                cursor: retryCount >= 3 ? "not-allowed" : "pointer",
              }}
            >
              {retryCount >= 3 ? "Trop de tentatives" : "Réessayer"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              style={styles.homeButton}
            >
              Accueil
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDU PRINCIPAL ──────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Fond décoratif */}
      <div style={styles.backgroundGrid} />
      <div style={styles.backgroundGlow} />

      <main style={styles.main}>
        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={styles.backButton}
            >
              <ArrowLeft size={20} />
            </motion.button>

            <div>
              <h1 style={styles.title}>
                Profil{" "}
                {profile.role === "admin" || profile.role === "superadmin"
                  ? "Administrateur"
                  : "Utilisateur"}
              </h1>
              <p style={styles.subtitle}>{profile.email}</p>
            </div>
          </div>

          <div style={styles.headerActions}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                ...styles.refreshButton,
                opacity: isRefreshing ? 0.5 : 1,
                cursor: isRefreshing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
              {isRefreshing ? "Chargement..." : "Rafraîchir"}
            </motion.button>

            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Edit2 size={16} />
                Modifier
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  style={styles.saveButton}
                >
                  <Save size={16} />
                  Sauvegarder
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      bio: profile.bio,
                      avatar: profile.avatar,
                    });
                  }}
                  style={styles.cancelButton}
                >
                  Annuler
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Carte de profil */}
        <div style={styles.profileCard}>
          <div style={styles.profileContent}>
            {/* Avatar */}
            <div style={styles.avatarContainer}>
              {profile.avatar &&
              typeof profile.avatar === "string" &&
              profile.avatar.startsWith("http") ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  style={styles.avatarImage}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {profile.firstName?.[0] || profile.lastName?.[0] || "U"}
                </div>
              )}
              {isEditing && (
                <button style={styles.avatarEditButton}>
                  <Camera size={16} color="white" />
                </button>
              )}
            </div>

            {/* Infos */}
            <div style={styles.infoContainer}>
              {!isEditing ? (
                <>
                  <h2 style={styles.userName}>
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <div style={styles.userMeta}>
                    <span style={styles.metaItem}>
                      <Mail size={14} />
                      {profile.email}
                    </span>
                    <span style={styles.metaItem}>
                      <Calendar size={14} />
                      Inscrit le{" "}
                      {new Date(profile.joinedDate).toLocaleDateString("fr-FR")}
                    </span>
                    <span
                      style={{
                        ...styles.roleBadge,
                        background:
                          profile.role === "admin" ||
                          profile.role === "superadmin"
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(99,102,241,0.1)",
                        borderColor:
                          profile.role === "admin" ||
                          profile.role === "superadmin"
                            ? "#ef4444"
                            : "#6366f1",
                        color:
                          profile.role === "admin" ||
                          profile.role === "superadmin"
                            ? "#ef4444"
                            : "#a5b4fc",
                      }}
                    >
                      {profile.role === "admin" || profile.role === "superadmin"
                        ? "Administrateur"
                        : profile.role === "formateur"
                          ? "Formateur"
                          : profile.role === "moderator"
                            ? "Modérateur"
                            : "Utilisateur"}
                    </span>
                    {profile.isOnline && (
                      <span style={styles.onlineBadge}>
                        <span style={styles.onlineDot} />
                        En ligne
                      </span>
                    )}
                  </div>
                  <p style={styles.bioText}>{profile.bio}</p>
                </>
              ) : (
                <div style={styles.editForm}>
                  <div style={styles.editFormRow}>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      placeholder="Prénom"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      placeholder="Nom"
                      style={styles.input}
                    />
                  </div>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Email"
                    style={{ ...styles.input, width: "100%", marginBottom: 12 }}
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    placeholder="Bio"
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              )}
            </div>

            {/* Niveau */}
            <div style={styles.levelCard}>
              <Award size={24} color="#6366f1" style={{ marginBottom: 4 }} />
              <div style={styles.levelValue}>{profile.level}</div>
              <div style={styles.levelLabel}>Niveau</div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div style={styles.statsGrid}>
          {statsItems.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              style={{
                ...styles.statCard,
                borderColor: `${stat.color}30`,
              }}
            >
              <div
                style={{
                  ...styles.statIcon,
                  background: `${stat.color}20`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Accomplissements */}
        <h2 style={styles.achievementsTitle}>
          Accomplissements ({achievements.filter((a) => a?.unlocked).length}/
          {achievements.length})
        </h2>
        <div style={styles.achievementsGrid}>
          {achievements.length === 0 ? (
            <div style={styles.emptyAchievements}>
              <Medal size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p>Aucun accomplissement pour le moment</p>
              <p style={styles.emptySubtext}>
                Faites des quiz pour débloquer des badges !
              </p>
            </div>
          ) : (
            achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ y: -2 }}
                style={{
                  ...styles.achievementCard,
                  borderColor: achievement.unlocked
                    ? "#10b981"
                    : "rgba(99,102,241,0.2)",
                  opacity: achievement.unlocked ? 1 : 0.6,
                }}
              >
                <div style={styles.achievementIcon}>
                  {achievement.icon || "🏆"}
                </div>
                <h3 style={styles.achievementTitle}>
                  {achievement.title || "Badge"}
                </h3>
                <p style={styles.achievementDescription}>
                  {achievement.description || "Accomplissement débloqué"}
                </p>
                {achievement.unlocked ? (
                  <p style={styles.achievementUnlocked}>
                    Obtenu{" "}
                    {achievement.date
                      ? `le ${new Date(achievement.date).toLocaleDateString("fr-FR")}`
                      : "récemment"}
                  </p>
                ) : (
                  achievement.progress !== undefined &&
                  achievement.total !== undefined && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressLabels}>
                        <span style={styles.progressLabel}>Progression</span>
                        <span style={styles.progressValue}>
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${Math.min((achievement.progress / achievement.total) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Actions */}
        <div style={styles.actionsContainer}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/choisir-niveau")}
            style={styles.actionButton}
          >
            <GraduationCap size={16} />
            {profile?.education ? "Modifier mon niveau d'étude" : "Choisir mon niveau d'étude"}
          </motion.button>

          {!['formateur', 'admin', 'superadmin', 'moderator'].includes(profile?.role) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/rejoindre-classe")}
              style={styles.actionButton}
            >
              <Users size={16} />
              Rejoindre une classe
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
            style={styles.actionButton}
          >
            <Settings size={16} />
            Paramètres
          </motion.button>

          {(profile.role === "admin" || profile.role === "superadmin") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/admin")}
              style={{
                ...styles.actionButton,
                background: "rgba(239,68,68,0.1)",
                borderColor: "rgba(239,68,68,0.3)",
                color: "#ef4444",
              }}
            >
              <UserCog size={16} />
              Administration
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              ...styles.actionButton,
              background: "rgba(239,68,68,0.1)",
              borderColor: "rgba(239,68,68,0.3)",
              color: "#ef4444",
            }}
          >
            <LogOut size={16} />
            Déconnexion
          </motion.button>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 6px;
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

// ─── STYLES ──────────────────────────────────────────────────────────────────────
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
    maxWidth: 1200,
    margin: "0 auto",
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
    width: 48,
    height: 48,
    border: "3px solid rgba(99,102,241,0.1)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
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
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  errorCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 24,
    padding: 48,
    maxWidth: 500,
    textAlign: "center",
  },
  errorTitle: {
    color: "#f8fafc",
    fontSize: "1.5rem",
    marginBottom: 8,
  },
  errorText: {
    color: "#94a3b8",
    marginBottom: 8,
  },
  retryText: {
    color: "#f59e0b",
    fontSize: "0.8rem",
    marginBottom: 16,
  },
  errorActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  retryButton: {
    padding: "12px 32px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontWeight: 600,
  },
  homeButton: {
    padding: "12px 32px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#94a3b8",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    borderRadius: 12,
    padding: 12,
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
  },
  subtitle: {
    color: "#94a3b8",
  },
  headerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: 8,
    color: "#60a5fa",
    cursor: "pointer",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8,
    color: "#a5b4fc",
    cursor: "pointer",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px 20px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    color: "#ef4444",
    cursor: "pointer",
  },
  profileCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
  },
  profileContent: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid rgba(99,102,241,0.3)",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    fontWeight: 600,
    color: "white",
    border: "4px solid rgba(99,102,241,0.3)",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    background: "#6366f1",
    border: "2px solid #0f172a",
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 4,
  },
  userMeta: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#94a3b8",
    fontSize: "0.85rem",
  },
  roleBadge: {
    padding: "4px 8px",
    border: "1px solid",
    borderRadius: 12,
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#10b981",
    fontSize: "0.75rem",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-block",
  },
  bioText: {
    color: "#a5b4fc",
    maxWidth: 500,
  },
  editForm: {
    maxWidth: 500,
  },
  editFormRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  input: {
    padding: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    color: "#f8fafc",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8,
    color: "#f8fafc",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  levelCard: {
    padding: "16px 24px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid #6366f1",
    borderRadius: 12,
    textAlign: "center",
  },
  levelValue: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#f8fafc",
  },
  levelLabel: {
    color: "#94a3b8",
    fontSize: "0.7rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#f8fafc",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "0.8rem",
  },
  achievementsTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#f8fafc",
    marginBottom: 16,
  },
  achievementsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  emptyAchievements: {
    gridColumn: "1/-1",
    textAlign: "center",
    padding: 40,
    background: "rgba(15,23,42,0.7)",
    borderRadius: 16,
    color: "#94a3b8",
  },
  emptySubtext: {
    fontSize: "0.8rem",
    marginTop: 8,
  },
  achievementCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderRadius: 12,
    padding: 16,
  },
  achievementIcon: {
    fontSize: "2rem",
    marginBottom: 8,
  },
  achievementTitle: {
    color: "#f8fafc",
    fontWeight: 600,
    marginBottom: 2,
  },
  achievementDescription: {
    color: "#94a3b8",
    fontSize: "0.75rem",
    marginBottom: 8,
  },
  achievementUnlocked: {
    color: "#10b981",
    fontSize: "0.7rem",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    marginBottom: 2,
  },
  progressLabel: {
    color: "#94a3b8",
  },
  progressValue: {
    color: "#a5b4fc",
  },
  progressBar: {
    width: "100%",
    height: 4,
    background: "#1e293b",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    background: "#6366f1",
    borderRadius: 2,
    transition: "width 0.5s ease",
  },
  actionsContainer: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8,
    color: "#a5b4fc",
    cursor: "pointer",
  },
};

export default ProfilePage;
