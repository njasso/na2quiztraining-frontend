import axios from 'axios';

const API_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}/api`; // Remplacez par votre URL backend

export const quizApi = {
  // Récupérer les quiz par matière
  getQuizzesBySubject: async (subjectId) => {
    try {
      const response = await axios.get(`${API_URL}/quizzes/by-subject/${subjectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de chargement des quiz');
    }
  },

  // Soumettre un quiz complété
  submitQuizAttempt: async (quizId, answers) => {
    try {
      const response = await axios.post(`${API_URL}/quiz-attempts`, {
        quizId,
        answers
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de soumission du quiz');
    }
  },

  // Créer un nouveau quiz (admin/formateur)
  createQuiz: async (quizData) => {
    try {
      const response = await axios.post(`${API_URL}/quizzes`, quizData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de création du quiz');
    }
  },

  // Récupérer l'historique utilisateur
  getQuizHistory: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de récupération de l\'historique');
    }
  }
};