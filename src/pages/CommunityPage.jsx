// src/pages/CommunityPage.jsx
// ✅ Version complète avec bouton "Créer un quiz communautaire"

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  ThumbsUp,
  Star,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  UserPlus,
  Award,
  TrendingUp,
  Loader,
  Plus,
  Globe,
} from "lucide-react";
import {
  getPublicQuizzes,
  getTopCreators,
  likeQuiz,
  unlikeQuiz,
  followUser,
  unfollowUser,
  getUserById,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { isScopeExemptRole, isContentInScope } from "../utils/educationScope";
import toast from "react-hot-toast";

import NavHome from '../components/NavHome';
const CommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("popular");
  const [searchTerm, setSearchTerm] = useState("");
  const [communityQuizzes, setCommunityQuizzes] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [likedQuizzes, setLikedQuizzes] = useState(new Set());
  const [followingCreators, setFollowingCreators] = useState(new Set());

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.id || user._id) {
          fetchUserFollows(user.id || user._id);
        }
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }

    fetchCommunityData();
  }, [filter, searchTerm]);

  const fetchUserFollows = async (userId) => {
    try {
      const user = await getUserById(userId);
      const following = new Set(user.following?.map((f) => f._id || f) || []);
      setFollowingCreators(following);
    } catch (error) {
      console.error("Erreur chargement follows:", error);
    }
  };

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [quizzes, creators] = await Promise.all([
        getPublicQuizzes({
          filter,
          search: searchTerm,
          limit: 10,
        }).catch((err) => {
          console.error("Erreur getPublicQuizzes:", err);
          return [];
        }),
        getTopCreators(4).catch((err) => {
          console.error("Erreur getTopCreators:", err);
          return [];
        }),
      ]);

      let quizzesArray = Array.isArray(quizzes)
        ? quizzes
        : quizzes?.data
          ? Array.isArray(quizzes.data)
            ? quizzes.data
            : []
          : [];

      // 🔒 Filet de sécurité côté client : un apprenant ne doit voir que les
      // quiz communautaires de son propre niveau (document de
      // recommandations §5 — même règle que ExamsPage.jsx).
      if (!isScopeExemptRole(user)) {
        quizzesArray = quizzesArray.filter((q) => isContentInScope(user, q));
      }

      const creatorsArray = Array.isArray(creators)
        ? creators
        : creators?.data
          ? Array.isArray(creators.data)
            ? creators.data
            : []
          : [];

      setCommunityQuizzes(quizzesArray);
      setTopCreators(creatorsArray);

      if (currentUser && currentUser.id) {
        const liked = new Set(
          quizzesArray
            .filter((q) => q.likedBy?.includes(currentUser.id))
            .map((q) => q.id),
        );
        setLikedQuizzes(liked);
      }
    } catch (error) {
      console.error("Erreur chargement communauté:", error);
      toast.error("Impossible de charger les données communautaires");
      setCommunityQuizzes([]);
      setTopCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (quizId) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour aimer un quiz");
      return;
    }

    try {
      if (likedQuizzes.has(quizId)) {
        await unlikeQuiz(quizId);
        setLikedQuizzes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
        setCommunityQuizzes((prev) =>
          prev.map((q) =>
            q.id === quizId
              ? { ...q, likes: Math.max(0, (q.likes || 1) - 1) }
              : q,
          ),
        );
        toast.success("Like retiré");
      } else {
        await likeQuiz(quizId);
        setLikedQuizzes((prev) => new Set([...prev, quizId]));
        setCommunityQuizzes((prev) =>
          prev.map((q) =>
            q.id === quizId ? { ...q, likes: (q.likes || 0) + 1 } : q,
          ),
        );
        toast.success("Quiz aimé !");
      }
    } catch (error) {
      console.error("Erreur like:", error);
      toast.error("Erreur lors du like");
    }
  };

  const handleFollow = async (creatorId) => {
    if (!currentUser) {
      toast.error("Connectez-vous pour suivre un créateur");
      return;
    }

    if (creatorId === (currentUser.id || currentUser._id)) {
      toast.error("Vous ne pouvez pas vous suivre vous-même");
      return;
    }

    try {
      if (followingCreators.has(creatorId)) {
        await unfollowUser(creatorId);
        setFollowingCreators((prev) => {
          const newSet = new Set(prev);
          newSet.delete(creatorId);
          return newSet;
        });
        toast.success("Créateur retiré des suivis");
      } else {
        await followUser(creatorId);
        setFollowingCreators((prev) => new Set([...prev, creatorId]));
        toast.success("Créateur suivi avec succès !");
      }
    } catch (error) {
      console.error("Erreur follow:", error);
      toast.error("Erreur lors du follow");
    }
  };

  const handleShare = (quiz) => {
    if (!quiz) return;

    const url = `${window.location.origin}/quiz/${quiz.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: quiz.title || "Quiz",
          text: `Découvrez ce quiz "${quiz.title}" sur NA2 Quiz !`,
          url: url,
        })
        .catch(() => {
          navigator.clipboard.writeText(url);
          toast.success("Lien copié dans le presse-papier !");
        });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
      <NavHome />
        <Loader size={48} className="animate-spin" color="#6366f1" />
        <p style={styles.loadingText}>Chargement de la communauté...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGrid} />
      <div style={styles.backgroundGlow} />

      <main style={styles.main}>
        {/* En-tête avec bouton Créer */}
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
              <div style={styles.badge}>
                <Users size={14} color="#10b981" />
                <span style={styles.badgeText}>COMMUNAUTÉ</span>
              </div>
              <h1 style={styles.title}>Quiz Communautaires</h1>
              <p style={styles.subtitle}>
                Découvrez les quiz créés par la communauté
              </p>
            </div>
          </div>

          {/* ✅ Bouton Créer un quiz communautaire — réservé formateur/admin */}
          {isScopeExemptRole(user) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/create-community-quiz")}
              style={styles.createButton}
            >
              <Plus size={20} />
              Créer un quiz communautaire
            </motion.button>
          )}
        </div>

        {/* Barre de recherche et filtres */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un quiz communautaire..."
              style={styles.searchInput}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="popular">Les plus populaires</option>
            <option value="recent">Récents</option>
            <option value="trending">Tendances</option>
            <option value="following">Mes créateurs</option>
          </select>
        </div>

        {/* Grille des quiz communautaires */}
        {!Array.isArray(communityQuizzes) || communityQuizzes.length === 0 ? (
          <div style={styles.emptyState}>
            <BookOpen size={48} color="#1e293b" style={{ marginBottom: 16 }} />
            <p style={styles.emptyText}>Aucun quiz trouvé</p>
            <p style={styles.emptySubtext}>
              {searchTerm
                ? "Essayez d'autres termes de recherche"
                : isScopeExemptRole(user)
                  ? "Soyez le premier à créer un quiz communautaire !"
                  : "Revenez plus tard, aucun formateur n'a encore publié de quiz pour votre niveau."}
            </p>
            {!searchTerm && isScopeExemptRole(user) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/create-community-quiz")}
                style={styles.emptyCreateButton}
              >
                <Plus size={18} />
                Créer le premier quiz
              </motion.button>
            )}
          </div>
        ) : (
          <div style={styles.quizGrid}>
            {communityQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                style={styles.quizCard}
              >
                <div style={styles.quizImage}>
                  <div style={styles.quizDifficulty}>
                    {quiz.difficulty || "Moyen"}
                  </div>
                </div>

                <div style={styles.quizContent}>
                  <div style={styles.authorSection}>
                    <div style={styles.authorAvatar}>
                      {quiz.authorAvatar ||
                        (quiz.author ? quiz.author.charAt(0) : "U")}
                    </div>
                    <div>
                      <span style={styles.authorLabel}>Créé par</span>
                      <p style={styles.authorName}>
                        {quiz.author || "Anonyme"}
                      </p>
                    </div>
                  </div>

                  <h3 style={styles.quizTitle}>{quiz.title || "Sans titre"}</h3>

                  <div style={styles.tagsContainer}>
                    {(quiz.tags || []).map((tag, i) => (
                      <span key={i} style={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div style={styles.quizActions}>
                    <div style={styles.actionsLeft}>
                      <button
                        onClick={() => handleLike(quiz.id)}
                        style={{
                          ...styles.likeButton,
                          color: likedQuizzes.has(quiz.id)
                            ? "#ef4444"
                            : "#94a3b8",
                        }}
                      >
                        <Heart
                          size={16}
                          fill={likedQuizzes.has(quiz.id) ? "#ef4444" : "none"}
                        />
                        <span style={styles.actionCount}>
                          {quiz.likes || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        style={styles.actionButton}
                      >
                        <MessageCircle size={16} />
                        <span style={styles.actionCount}>
                          {quiz.comments || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => handleShare(quiz)}
                        style={styles.actionButton}
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    <div style={styles.actionsRight}>
                      <BookOpen size={14} color="#64748b" />
                      <span style={styles.actionCount}>
                        {quiz.questionsCount || quiz.questions?.length || 0}
                      </span>
                      <Star
                        size={14}
                        color="#f59e0b"
                        style={{ marginLeft: 8 }}
                      />
                      <span style={styles.actionCount}>
                        {quiz.rating || "4.5"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Top créateurs */}
        <h2 style={styles.creatorsTitle}>Créateurs populaires</h2>
        <div style={styles.creatorsGrid}>
          {!Array.isArray(topCreators) || topCreators.length === 0 ? (
            <div style={styles.creatorsEmpty}>
              <Award size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p>Aucun créateur pour le moment</p>
            </div>
          ) : (
            topCreators.map((creator) => {
              const isFollowing = followingCreators.has(creator.id);
              const colors = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"];
              const color = colors[Math.floor(Math.random() * colors.length)];

              return (
                <motion.div
                  key={creator.id}
                  whileHover={{ y: -4 }}
                  style={styles.creatorCard}
                >
                  <div
                    style={{
                      ...styles.creatorAvatar,
                      background: `linear-gradient(135deg, ${color}, ${color}80)`,
                    }}
                  >
                    {creator.avatar ||
                      (creator.name ? creator.name.charAt(0) : "U")}
                  </div>
                  <div style={styles.creatorInfo}>
                    <h4 style={styles.creatorName}>
                      {creator.name || "Anonyme"}
                    </h4>
                    <div style={styles.creatorStats}>
                      <span>{creator.quizzesCount || 0} quiz</span>
                      <span>{creator.followersCount || 0} abonnés</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleFollow(creator.id)}
                    style={{
                      ...styles.followButton,
                      background: isFollowing
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(99,102,241,0.1)",
                      border: `1px solid ${isFollowing ? "#10b981" : "rgba(99,102,241,0.3)"}`,
                      color: isFollowing ? "#10b981" : "#a5b4fc",
                    }}
                  >
                    <UserPlus size={14} />
                  </motion.button>
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

// ─── Styles ──────────────────────────────────────────────────────

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
  loadingText: {
    color: "#94a3b8",
    marginTop: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
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
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 12px",
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: "#a5b4fc",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#f8fafc",
  },
  subtitle: {
    color: "#94a3b8",
  },
  createButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
    flexShrink: 0,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    minWidth: 280,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 42px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 12,
    color: "#f8fafc",
    outline: "none",
  },
  filterSelect: {
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 12,
    color: "#f8fafc",
    outline: "none",
  },
  emptyState: {
    textAlign: "center",
    padding: 60,
    background: "rgba(15,23,42,0.7)",
    borderRadius: 24,
    marginBottom: 40,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "1.1rem",
  },
  emptySubtext: {
    color: "#64748b",
    fontSize: "0.9rem",
    marginTop: 8,
  },
  emptyCreateButton: {
    marginTop: 16,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  quizGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: 20,
    marginBottom: 40,
  },
  quizCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 20,
    overflow: "hidden",
  },
  quizImage: {
    height: 140,
    backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  quizDifficulty: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: "4px 12px",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    color: "#f8fafc",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  quizContent: {
    padding: 20,
  },
  authorSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  authorLabel: {
    color: "#94a3b8",
    fontSize: "0.7rem",
  },
  authorName: {
    color: "#f8fafc",
    fontWeight: 500,
  },
  quizTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#f8fafc",
    marginBottom: 8,
  },
  tagsContainer: {
    display: "flex",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tag: {
    padding: "2px 8px",
    background: "rgba(99,102,241,0.1)",
    borderRadius: 12,
    color: "#a5b4fc",
    fontSize: "0.6rem",
  },
  quizActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  actionsLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  actionsRight: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  likeButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
  },
  actionCount: {
    color: "#94a3b8",
    fontSize: "0.7rem",
  },
  creatorsTitle: {
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#f8fafc",
    marginBottom: 16,
  },
  creatorsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  creatorsEmpty: {
    gridColumn: "1/-1",
    textAlign: "center",
    padding: 40,
    background: "rgba(15,23,42,0.7)",
    borderRadius: 16,
    color: "#94a3b8",
  },
  creatorCard: {
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    flexShrink: 0,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: "#f8fafc",
    fontWeight: 600,
    marginBottom: 2,
  },
  creatorStats: {
    display: "flex",
    gap: 8,
    fontSize: "0.7rem",
    color: "#94a3b8",
  },
  followButton: {
    borderRadius: 8,
    padding: 6,
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default CommunityPage;
