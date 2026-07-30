// src/services/quizData.js — VERSION CORRIGÉE
// Corrections :
//   - double return supprimé
//   - this.mergeData() → QuizDataService.mergeData() (this invalide dans arrow fn)
//   - this.resolveConflict() → logique inline (fonction inexistante)
import { getQuizzes } from './api';

export const QuizDataService = {
  /**
   * Charge les quiz depuis le backend
   * @param {Object} params - filtres optionnels
   */
  loadQuizzes: async (params = {}) => {
    try {
      const response = await getQuizzes(params);
      return response?.data || [];
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      return [];
    }
  },

  /**
   * Charge et fusionne quiz locaux + en ligne
   */
  loadCombinedData: async () => {
    const local = QuizDataService.getLocalQuizzes();

    try {
      const response = await getQuizzes();
      const online = response?.data || [];
      // ✅ this.mergeData → QuizDataService.mergeData (plus de 'this' invalide)
      return QuizDataService.mergeData(local, online);
    } catch {
      // Si le backend est indisponible, retourner les données locales
      return local;
    }
  },

  /**
   * Récupère les quiz sauvegardés localement
   */
  getLocalQuizzes: () => {
    try {
      const raw = localStorage.getItem('localQuizzes');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Fusionne quiz locaux et en ligne — déduplique par id
   * ✅ double return supprimé, logique clarifiée
   */
  mergeData: (local = [], online = []) => {
    if (!Array.isArray(local)) local = [];
    if (!Array.isArray(online)) online = [];

    // Créer un Map online indexé par id pour lookup rapide
    const onlineMap = new Map(online.map((q) => [q.id || q._id?.toString(), q]));
    const localMap  = new Map(local.map((q) => [q.id || q._id?.toString(), q]));

    // ✅ Plus de double return
    const merged = [];

    // Parcourir les online : prendre la version online si conflit
    for (const [id, onlineItem] of onlineMap) {
      const localItem = localMap.get(id);
      if (localItem && new Date(localItem.updatedAt) > new Date(onlineItem.updatedAt)) {
        // Donnée locale plus récente → garder locale
        merged.push(localItem);
      } else {
        merged.push(onlineItem);
      }
    }

    // Ajouter les items locaux qui n'existent pas en ligne (créés hors-ligne)
    for (const [id, localItem] of localMap) {
      if (!onlineMap.has(id)) {
        merged.push(localItem);
      }
    }

    return merged;
  },

  /**
   * Sauvegarder un quiz localement
   */
  saveLocalQuiz: (quiz) => {
    const local = QuizDataService.getLocalQuizzes();
    const idx = local.findIndex(q => (q.id || q._id) === (quiz.id || quiz._id));
    if (idx >= 0) {
      local[idx] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      local.push({ ...quiz, id: quiz.id || `local_${Date.now()}`, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem('localQuizzes', JSON.stringify(local));
  },

  /**
   * Supprimer un quiz local
   */
  deleteLocalQuiz: (id) => {
    const local = QuizDataService.getLocalQuizzes().filter(
      q => (q.id || q._id?.toString()) !== id
    );
    localStorage.setItem('localQuizzes', JSON.stringify(local));
  },
};

export default QuizDataService;
