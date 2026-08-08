// src/services/api.js — NA2 Quiz
// Version complète avec tous les exports nécessaires

import axios from 'axios';
import { getDeviceFingerprint, getDeviceLabel } from '../utils/deviceFingerprint';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

// ─── Gestion du refresh token ──────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ─── Intercepteur requête : injection du token Bearer ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const authRoutes = ['/auth/login', '/auth/register', '/auth/facebook', '/auth/google'];
    const isAuthRoute = authRoutes.some(route => config.url?.includes(route));
    
    if (!isAuthRoute) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Intercepteur réponse : refresh automatique sur 401 ───────────────────────
const EXCLUDED_ROUTES = [
  '/auth/login', 
  '/auth/register', 
  '/auth/facebook', 
  '/auth/google',
  '/auth/refresh',
  '/auth/verify',
  '/stats/global', 
  '/quizzes/public',
  '/health'
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    const isExcluded = EXCLUDED_ROUTES.some((route) => originalRequest.url?.includes(route));
    
    if (isExcluded || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const stored = localStorage.getItem('refreshToken');
      if (!stored) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('No refresh token');
      }

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: stored });

      if (!data?.success || !data?.token) {
        throw new Error('Refresh failed');
      }

      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      processQueue(null, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Utilitaire interne ────────────────────────────────────────────────────────
const extractArray = (data, keys = ['results', 'data']) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  return [];
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTHENTIFICATION
// ══════════════════════════════════════════════════════════════════════════════

export const login = async (credentials, revokeDeviceId) => {
  try {
    // CORRECTION : limite de 2 appareils connectes simultanement — le
    // serveur a besoin d'un identifiant d'appareil stable pour appliquer
    // cette limite (voir models/Session.js cote backend). revokeDeviceId
    // (optionnel) permet de liberer un appareil directement depuis l'ecran
    // de connexion, sans session prealable sur CET appareil.
    const { data } = await api.post('/auth/login', {
      ...credentials,
      deviceId: getDeviceFingerprint(),
      deviceLabel: getDeviceLabel(),
      ...(revokeDeviceId ? { revokeDeviceId } : {}),
    });
    console.log('📦 Login response from server:', data);
    
    if (data?.success && data?.token) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('deviceId', data.deviceId || getDeviceFingerprint());
    }
    return data;
  } catch (error) {
    // Le blocage explicite (409 DEVICE_LIMIT_REACHED) doit remonter tel
    // quel jusqu'à l'écran de connexion pour afficher la liste des
    // appareils actifs — ne pas l'avaler ici.
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    
    if (data?.success && data?.token) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    throw error.response?.data || { error: "Erreur d'inscription" };
  }
};

export const logout = async () => {
  try {
    if (localStorage.getItem('token')) {
      const deviceId = localStorage.getItem('deviceId') || getDeviceFingerprint();
      await api.post('/auth/logout', { deviceId }).catch(() => {});
    }
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('deviceId');
    window.location.href = '/login';
  }
};

export const verifyToken = async () => {
  try {
    if (!localStorage.getItem('token')) {
      return { success: false, user: null };
    }
    const { data } = await api.get('/auth/verify');
    return { success: true, user: data?.user || null };
  } catch {
    return { success: false, user: null };
  }
};

export const refreshTokenFn = async () => {
  try {
    const stored = localStorage.getItem('refreshToken');
    if (!stored) throw new Error('No refresh token');
    
    const deviceId = localStorage.getItem('deviceId') || getDeviceFingerprint();
    const { data } = await api.post('/auth/refresh', { refreshToken: stored, deviceId });
    
    if (!data?.success || !data?.token) {
      throw new Error('Refresh failed');
    }
    
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw error;
  }
};

export const getMyDevices = async () => (await api.get('/auth/sessions')).data;
export const revokeDevice = async (sessionId) => (await api.delete(`/auth/sessions/${sessionId}`)).data;

export const changePassword = async (oldPassword, newPassword) => {
  const { data } = await api.put('/auth/change-password', { oldPassword, newPassword });
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
};

export const fetchMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const fetchSocialUser = async () => {
  try {
    const { data } = await api.get('/auth/me');
    if (data?.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data?.user || null;
  } catch {
    return null;
  }
};

export const initiateFacebookLogin = () => { 
  window.location.href = `${API_URL}/auth/facebook`; 
};

export const initiateGoogleLogin = () => { 
  window.location.href = `${API_URL}/auth/google`; 
};

export const handleSocialCallback = (token, refreshToken, user) => {
  if (!token) return { success: false, error: 'Token manquant' };
  
  localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  
  return { success: true };
};

export const getCurrentUser = () => {
  try { 
    return JSON.parse(localStorage.getItem('user')); 
  } catch { 
    return null; 
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token && token !== 'undefined' && token !== 'null';
};

// ══════════════════════════════════════════════════════════════════════════════
// UTILISATEURS
// ══════════════════════════════════════════════════════════════════════════════

export const getUsers = async (params = {}) => (await api.get('/users', { params })).data;
export const getUserById = async (id) => (await api.get(`/users/${id}`)).data;
export const fetchUserProfile = async (id) => (await api.get(`/users/${id}`)).data;
export const updateUser = async (id, data) => (await api.put(`/users/${id}`, data)).data;
export const deleteUser = async (id) => (await api.delete(`/users/${id}`)).data;
export const getUserStats = async (id) => (await api.get(`/users/${id}/stats`)).data;
export const getLeaderboard = async (params = {}) => (await api.get('/users/leaderboard', { params })).data;
export const getUserAchievements = async (id) => (await api.get(`/users/${id}/achievements`)).data;
export const getTopCreators = async (limit = 10) => (await api.get('/users/top-creators', { params: { limit } })).data;
export const followUser = async (id) => (await api.post(`/users/${id}/follow`)).data;
export const unfollowUser = async (id) => (await api.delete(`/users/${id}/follow`)).data;
export const deleteAccount = async (id) => (await api.delete(`/users/${id}`)).data;
export const exportUserData = async () => (await api.get('/users/export-data')).data;
export const createUser = async (data) => (await api.post('/users', data)).data;

// ✅ ALIAS POUR COMPATIBILITÉ AVEC ProfilePage ET SettingsPage
export const getUserProfile = async (id) => (await api.get(`/users/${id}`)).data;
export const updateUserProfile = async (id, data) => (await api.put(`/users/${id}`, data)).data;

// ✅ PARAMÈTRES UTILISATEUR
export const getSettings = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Non authentifié');
    const data = await getUserById(user.id || user._id);
    return data;
  } catch (error) {
    console.error('Erreur getSettings:', error);
    throw error;
  }
};

export const updateSettings = async (settings) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Non authentifié');
    const data = await updateUser(user.id || user._id, settings);
    return data;
  } catch (error) {
    console.error('Erreur updateSettings:', error);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GESTION DES COMPTES UTILISATEURS (Administration)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 */
export const resetUserPassword = async (userId, newPassword) => {
  try {
    const { data } = await api.post(`/users/${userId}/reset-password`, { newPassword });
    return data;
  } catch (error) {
    console.error('❌ Erreur resetUserPassword:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

/**
 * Verrouiller un compte utilisateur
 */
export const lockUserAccount = async (userId) => {
  try {
    const { data } = await api.post(`/users/${userId}/lock`);
    return data;
  } catch (error) {
    console.error('❌ Erreur lockUserAccount:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

/**
 * Déverrouiller un compte utilisateur
 */
export const unlockUserAccount = async (userId) => {
  try {
    const { data } = await api.post(`/users/${userId}/unlock`);
    return data;
  } catch (error) {
    console.error('❌ Erreur unlockUserAccount:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

/**
 * Récupérer les sessions actives d'un utilisateur
 */
export const getUserSessions = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/sessions`);
    return data;
  } catch (error) {
    console.error('❌ Erreur getUserSessions:', error);
    return [];
  }
};

/**
 * Récupérer l'historique des connexions d'un utilisateur
 */
export const getUserLoginHistory = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/login-history`);
    return data;
  } catch (error) {
    console.error('❌ Erreur getUserLoginHistory:', error);
    return [];
  }
};

/**
 * Révoquer une session utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} sessionId - ID de la session ou 'all' pour tout révoquer
 */
export const revokeUserSession = async (userId, sessionId) => {
  try {
    const { data } = await api.post(`/users/${userId}/sessions/${sessionId}/revoke`);
    return data;
  } catch (error) {
    console.error('❌ Erreur revokeUserSession:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export const getDashboardData = async () => (await api.get('/dashboard')).data;

// ══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ══════════════════════════════════════════════════════════════════════════════

export const getQuizzes = async (params = {}) => (await api.get('/quizzes', { params })).data;
export const getQuizById = async (id) => (await api.get(`/quizzes/${id}`)).data;
export const createQuiz = async (data) => (await api.post('/quizzes', data)).data;
export const updateQuiz = async (id, data) => (await api.put(`/quizzes/${id}`, data)).data;
export const deleteQuiz = async (id) => (await api.delete(`/quizzes/${id}`)).data;
export const getPublicQuizzes = async (params = {}) => (await api.get('/quizzes/public', { params })).data;
export const getQuizComments = async (id) => (await api.get(`/quizzes/${id}/comments`)).data;
export const likeQuiz = async (id) => (await api.post(`/quizzes/${id}/like`)).data;
export const unlikeQuiz = async (id) => (await api.delete(`/quizzes/${id}/like`)).data;

export const submitQuiz = async (id, answers) => {
  const { data } = await api.post(`/quizzes/${id}/submit`, { answers });
  return data;
};

// ══════════════════════════════════════════════════════════════════════════════
// QUESTIONS
// ══════════════════════════════════════════════════════════════════════════════

export const getQuestions = async (params = {}) => {
  try {
    const { data } = await api.get('/questions', { params });
    return data;
  } catch (error) {
    console.error('Erreur getQuestions:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

// CORRECTION (audit strategique 1.1 + 3.1/3.2) : getQuestions() renvoie
// toujours les memes questions dans le meme ordre (tri par date de creation,
// aucun melange), ET expose la bonne reponse en clair a l'apprenant avant
// meme qu'il ne reponde. getQuizSet() utilise la route serveur dediee
// (deja construite, jamais appelee jusqu'ici) qui melange questions et
// options de facon reproductible par apprenant, et NE RENVOIE JAMAIS les
// reponses pour un role 'user'. La correction se fait ensuite exclusivement
// via gradeAnswers() (POST /questions/grade), jamais en local.
export const getQuizSet = async (params = {}) => {
  try {
    const { data } = await api.get('/questions/quiz-set', { params });
    return data;
  } catch (error) {
    console.error('Erreur getQuizSet:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const gradeAnswers = async (answers) => {
  try {
    const { data } = await api.post('/questions/grade', { answers });
    return data;
  } catch (error) {
    console.error('Erreur gradeAnswers:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const getQuestionById = async (id) => {
  try {
    const { data } = await api.get(`/questions/${id}`);
    return data;
  } catch (error) {
    console.error('Erreur getQuestionById:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const createQuestion = async (questionData) => {
  try {
    const payload = {
      ...questionData,
      selectedDomaine: questionData.selectedDomaine || questionData.domaine || 'Éducatif',
    };
    const { data } = await api.post('/questions', payload);
    return data;
  } catch (error) {
    console.error('Erreur createQuestion:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const updateQuestion = async (id, questionData) => {
  try {
    const { data } = await api.put(`/questions/${id}`, questionData);
    return data;
  } catch (error) {
    console.error('Erreur updateQuestion:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const deleteQuestion = async (id) => {
  try {
    const { data } = await api.delete(`/questions/${id}`);
    return data;
  } catch (error) {
    console.error('Erreur deleteQuestion:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const saveQuestions = async (data) => {
  try {
    let payload = data;
    
    if (Array.isArray(data)) {
      payload = { questions: data };
    }
    
    if (payload.questions && Array.isArray(payload.questions)) {
      payload.questions = payload.questions.map((q, index) => {
        let selectedDomaine = q.selectedDomaine;
        
        if (!selectedDomaine) {
          if (q.domaineId === '1' || q.domaine === 'Éducatif') {
            selectedDomaine = 'Éducatif';
          } else if (q.domaineId === '2' || q.domaine === 'Professionnel') {
            selectedDomaine = 'Professionnel';
          } else if (q.domaineId === '3' || q.domaine === 'Culturel') {
            selectedDomaine = 'Culturel';
          } else {
            selectedDomaine = q.domaine || 'Éducatif';
          }
        }
        
        return {
          ...q,
          selectedDomaine: selectedDomaine,
          libQuestion: q.libQuestion || q.question || q.text || '',
          libChapitre: q.libChapitre || q.chapitre || q.chapter || 'Général',
          domaineId: String(q.domaineId || '1'),
          sousDomaineId: String(q.sousDomaineId || '12'),
          niveauId: String(q.niveauId || '124'),
          matiereId: String(q.matiereId || '1215'),
          options: Array.isArray(q.options) ? q.options : 
                   (q.options ? String(q.options).split('|').map(o => o.trim()) : ['Option A', 'Option B']),
          correctAnswer: q.correctAnswer || q.bonOpRep !== undefined ? String(q.correctAnswer || q.bonOpRep) : '',
          typeQuestion: parseInt(q.typeQuestion) || 1,
        };
      });
    }
    
    console.log(`📤 Import de ${payload.questions?.length || 0} questions`);
    
    const { data: response } = await api.post('/questions/save-multiple', payload);
    return response;
  } catch (error) {
    console.error('❌ Erreur saveQuestions:', error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { success: false, error: error.message || 'Erreur lors de l\'importation' };
  }
};

export const importQuestions = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await api.post('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    console.error('Erreur importQuestions:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const exportQuestions = async (params = {}) => {
  try {
    const { data } = await api.get('/questions/export', { 
      params, 
      responseType: 'blob' 
    });
    return data;
  } catch (error) {
    console.error('Erreur exportQuestions:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const updateQuestionStatus = async (id, status, rejectionReason = '') => {
  try {
    const { data } = await api.patch(`/questions/${id}/status`, { status, rejectionReason });
    return data;
  } catch (error) {
    console.error('Erreur updateQuestionStatus:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const getQuestionStats = async () => {
  try {
    const { data } = await api.get('/questions/stats/domains');
    return data;
  } catch (error) {
    console.error('Erreur getQuestionStats:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const bulkRenameChapter = async (oldChapter, newChapter, matiereId = null) => {
  try {
    const payload = { oldChapter, newChapter };
    if (matiereId) payload.matiereId = matiereId;
    const { data } = await api.post('/questions/bulk-rename-chapter', payload);
    return data;
  } catch (error) {
    console.error('Erreur bulkRenameChapter:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const normalizeChapters = async () => {
  try {
    const { data } = await api.post('/questions/bulk-normalize-chapters');
    return data;
  } catch (error) {
    console.error('Erreur normalizeChapters:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

export const getChapterDuplicates = async () => {
  try {
    const { data } = await api.get('/questions/chapter-duplicates');
    return data;
  } catch (error) {
    console.error('Erreur getChapterDuplicates:', error);
    throw error.response?.data || { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// EXAMENS
// ══════════════════════════════════════════════════════════════════════════════

export const getExams = async (params = {}) => (await api.get('/exams', { params })).data;

// CORRECTION SECURITE CRITIQUE (audit) : POST /results faisait confiance au
// score envoye par le CLIENT sans aucune verification. submitExam() utilise
// desormais POST /exams/:id/submit, qui recalcule le score exclusivement a
// partir des reponses stockees en base — le client ne fait plus que
// transmettre ses reponses, jamais un score.
export const submitExam = async (examId, payload) =>
  (await api.post(`/exams/${examId}/submit`, payload)).data;
export const getExamById = async (id) => (await api.get(`/exams/${id}`)).data;
export const createExam = async (data) => (await api.post('/exams', data)).data;
export const updateExam = async (id, data) => (await api.put(`/exams/${id}`, data)).data;
export const deleteExam = async (id) => (await api.delete(`/exams/${id}`)).data;
export const generateExam = async (params) => (await api.post('/exams/generate', params)).data;

// ══════════════════════════════════════════════════════════════════════════════
// SIKOLO — formations et leçons en PDF (audit stratégique 2.3)
// ══════════════════════════════════════════════════════════════════════════════
export const getLessons = async (params = {}) => (await api.get('/lessons', { params })).data;
export const viewLesson = async (id) => (await api.get(`/lessons/${id}/view`)).data;
export const downloadLesson = async (id) => (await api.get(`/lessons/${id}/download`)).data;
export const publishLesson = async (formData) =>
  (await api.post('/lessons', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
export const deleteLesson = async (id) => (await api.delete(`/lessons/${id}`)).data;

export const createContentRequest = async (data) => (await api.post('/content-requests', data)).data;
export const getContentRequests = async (params = {}) => (await api.get('/content-requests', { params })).data;
export const updateContentRequestStatus = async (id, data) => (await api.patch(`/content-requests/${id}`, data)).data;

// ══════════════════════════════════════════════════════════════════════════════
// RÉSULTATS
// ══════════════════════════════════════════════════════════════════════════════

export const getResults = async (params = {}) => {
  try {
    return extractArray((await api.get('/results', { params })).data);
  } catch {
    return [];
  }
};

export const saveResult = async (data) => (await api.post('/results', data)).data;
export const getUserResults = async (userId) => (await api.get(`/results/user/${userId}`)).data;
export const getQuizResults = async (quizId) => (await api.get(`/results/quiz/${quizId}`)).data;

// ══════════════════════════════════════════════════════════════════════════════
// STATISTIQUES
// ══════════════════════════════════════════════════════════════════════════════

export const getStats = async () => {
  try {
    // CORRECTION : /stats/global exigeait une authentification, donc chaque
    // visiteur non connecte recevait un 401 et la page d'accueil affichait des zeros.
    // /stats/public est accessible sans connexion et renvoie les memes agregats.
    const res = await api.get('/stats/public');
    return res.data?.data || res.data || {};
  } catch {
    return { totalQuizzes: 0, averageScore: 0, totalUsers: 0, totalResults: 0 };
  }
};

export const getGlobalStats = async () => (await api.get('/stats/global')).data;
export const getWeeklyStats = async () => (await api.get('/stats/weekly')).data;

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const getNotifications = async () => (await api.get('/notifications')).data;
export const markNotificationAsRead = async (id) => (await api.put(`/notifications/${id}/read`)).data;
export const markAllNotificationsAsRead = async () => (await api.put('/notifications/read-all')).data;
export const deleteNotification = async (id) => (await api.delete(`/notifications/${id}`)).data;
export const getNotificationSettings = async () => (await api.get('/notifications/settings')).data;
export const updateNotificationSettings = async (settings) => (await api.put('/notifications/settings', settings)).data;
export const sendNotification = async (data) => (await api.post('/notifications/send', data)).data;

// ══════════════════════════════════════════════════════════════════════════════
// IA / GÉNÉRATION
// ══════════════════════════════════════════════════════════════════════════════

export const generateQuestions = async (data) => {
  try {
    return (await api.post('/ai/generate-questions', data)).data;
  } catch (error) {
    throw error.response?.data || { error: 'Erreur lors de la génération' };
  }
};

export const generateQuizWithAI = async (params) => {
  try {
    return (await api.post('/ai/generate-quiz', params)).data;
  } catch (error) {
    throw error.response?.data || { error: 'Erreur lors de la génération du quiz' };
  }
};

export const generateSummary = async (data) => {
  try {
    return (await api.post('/generate-summary', data)).data;
  } catch (error) {
    throw error.response?.data || { error: 'Erreur lors de la génération du résumé' };
  }
};

export const generateExplanation = async (data) => {
  try {
    return (await api.post('/generate-explanation', data)).data;
  } catch (error) {
    throw error.response?.data || { error: "Erreur lors de la génération de l'explication" };
  }
};

export const checkAIConfig = async () => {
  try {
    return (await api.get('/check-config')).data;
  } catch {
    return { configured: false };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SUGGESTIONS & COMMENTAIRES
// ══════════════════════════════════════════════════════════════════════════════

export const getSuggestions = async (params = {}) => {
  try {
    const { data } = await api.get('/suggestions', { params });
    return data;
  } catch (error) {
    console.error('getSuggestions error:', error);
    throw error;
  }
};

export const getSuggestionById = async (id) => {
  const { data } = await api.get(`/suggestions/${id}`);
  return data;
};

export const createSuggestion = async (suggestionData) => {
  const { data } = await api.post('/suggestions', suggestionData);
  return data;
};

export const voteSuggestion = async (id) => {
  const { data } = await api.post(`/suggestions/${id}/vote`);
  return data;
};

export const updateSuggestionStatus = async (id, status) => {
  const { data } = await api.put(`/suggestions/${id}`, { status });
  return data;
};

export const deleteSuggestion = async (id) => {
  const { data } = await api.delete(`/suggestions/${id}`);
  return data;
};

export const getComments = async (suggestionId) => {
  const { data } = await api.get(`/suggestions/${suggestionId}/comments`);
  return data;
};

export const addComment = async (suggestionId, commentData) => {
  const { data } = await api.post(`/suggestions/${suggestionId}/comments`, commentData);
  return data;
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMINISTRATION
// ══════════════════════════════════════════════════════════════════════════════

export const getConfig = async () => (await api.get('/admin/config')).data;
export const updateConfig = async (data) => (await api.put('/admin/config', data)).data;
export const resetConfig = async () => (await api.post('/admin/config/reset')).data;
export const getSystemStats = async () => (await api.get('/admin/system/stats')).data;
export const getSystemHealth = async () => (await api.get('/admin/system/health')).data;
export const clearCache = async () => (await api.post('/admin/cache/clear')).data;

export const exportData = async (type, format = 'json') =>
  (await api.get(`/admin/export/${type}`, { params: { format } })).data;

export const importData = async (type, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post(`/admin/import/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

export const exportUsers = async (params = {}) =>
  (await api.get('/users/export', { params, responseType: 'blob' })).data;

export const importUsers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/users/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

// ══════════════════════════════════════════════════════════════════════════════
// UPLOAD
// ══════════════════════════════════════════════════════════════════════════════

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

// ══════════════════════════════════════════════════════════════════════════════
// DOMAINES & MATIÈRES
// ══════════════════════════════════════════════════════════════════════════════

export const getDomains = async () => (await api.get('/domains')).data;
export const getSubjects = async (params = {}) => (await api.get('/subjects', { params })).data;

// ══════════════════════════════════════════════════════════════════════════════
// CORRECTIONS & COMPOSITION
// ══════════════════════════════════════════════════════════════════════════════

export const getCorrections = async (quizId) => (await api.get(`/corrections/quiz/${quizId}`)).data;
export const saveCorrection = async (data) => (await api.post('/corrections', data)).data;
export const composeQuiz = async (data) => (await api.post('/compose', data)).data;
export const getCompositions = async () => (await api.get('/compose')).data;

// ══════════════════════════════════════════════════════════════════════════════
// CHALLENGES & ACHIEVEMENTS
// ══════════════════════════════════════════════════════════════════════════════

// NOTE : ces trois fonctions n'ont pas de route backend correspondante
// (/challenges et /achievements ne sont montees nulle part dans server.js).
// ChallengesPage.jsx ne les utilise pas — il calcule tout depuis getResults().
// Conservees ici uniquement si un futur module Challenges/Achievements est prevu ;
// sinon, les endpoints devront etre crees cote backend avant tout appel reel.
export const getChallenges = async () => (await api.get('/challenges')).data;
export const completeChallenge = async (id) => (await api.post(`/challenges/${id}/complete`)).data;
export const getAchievements = async () => (await api.get('/achievements')).data;

// ══════════════════════════════════════════════════════════════════════════════
// CLASSES (rattachement formateur ↔ apprenants — document de recommandations §4)
// ══════════════════════════════════════════════════════════════════════════════
// ⚠️ Ces endpoints nécessitent le backend correspondant (hors de ce dépôt) :
//   POST   /classes                → { nom, niveauId?, matiereId?, description? }
//   GET    /classes/mine           → classes du formateur connecté
//   GET    /classes/:id            → détail + liste des membres
//   POST   /classes/join           → { code } — l'apprenant rejoint une classe
//   DELETE /classes/:id/membre/:userId → retirer un membre
//   POST   /classes/:id/regenerer-code → change le code d'invitation

export const createClasse = async (data) => (await api.post('/classes', data)).data;
export const getMyClasses = async () => (await api.get('/classes/mine')).data;
export const getClasseDetails = async (id) => (await api.get(`/classes/${id}`)).data;
export const joinClasseByCode = async (code) => (await api.post('/classes/join', { code })).data;
export const removeClasseMember = async (classeId, userId) =>
  (await api.delete(`/classes/${classeId}/membre/${userId}`)).data;
export const regenerateClasseCode = async (classeId) =>
  (await api.post(`/classes/${classeId}/regenerer-code`)).data;

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT PAR DÉFAUT
// ══════════════════════════════════════════════════════════════════════════════

export default {
  // Auth
  login,
  register,
  logout,
  verifyToken,
  refreshTokenFn,
  changePassword,
  updateProfile,
  fetchMe,
  fetchSocialUser,
  initiateFacebookLogin,
  initiateGoogleLogin,
  handleSocialCallback,
  getCurrentUser,
  isAuthenticated,
  
  // Users
  getUsers,
  getUserById,
  getUserProfile,
  fetchUserProfile,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserStats,
  getLeaderboard,
  getUserAchievements,
  getTopCreators,
  followUser,
  unfollowUser,
  deleteAccount,
  exportUserData,
  createUser,
  
  // Gestion des comptes (Admin)
  resetUserPassword,
  lockUserAccount,
  unlockUserAccount,
  getUserSessions,
  getUserLoginHistory,
  revokeUserSession,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Dashboard
  getDashboardData,
  
  // Quizzes
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getPublicQuizzes,
  getQuizComments,
  likeQuiz,
  unlikeQuiz,
  submitQuiz,
  
  // Questions
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveQuestions,
  importQuestions,
  exportQuestions,
  updateQuestionStatus,
  getQuestionStats,
  bulkRenameChapter,
  normalizeChapters,
  getChapterDuplicates,
  
  // Exams
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  generateExam,
  
  // Results
  getResults,
  saveResult,
  getUserResults,
  getQuizResults,
  
  // Stats
  getStats,
  getGlobalStats,
  getWeeklyStats,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  sendNotification,
  
  // AI
  generateQuestions,
  generateQuizWithAI,
  generateSummary,
  generateExplanation,
  checkAIConfig,
  
  // Suggestions
  getSuggestions,
  getSuggestionById,
  createSuggestion,
  voteSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  getComments,
  addComment,
  
  // Admin
  getConfig,
  updateConfig,
  resetConfig,
  getSystemStats,
  getSystemHealth,
  clearCache,
  exportData,
  importData,
  exportUsers,
  importUsers,
  
  // Upload
  uploadFile,
  
  // Domains
  getDomains,
  getSubjects,
  
  // Corrections & Composition
  getCorrections,
  saveCorrection,
  composeQuiz,
  getCompositions,
  
  // Challenges & Achievements
  getChallenges,
  completeChallenge,
  getAchievements,
  
  // API instance
  api,
};

// Export nommé pour l'instance axios
export { api };