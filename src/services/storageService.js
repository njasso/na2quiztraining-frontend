export const StorageService = {
  getQuizzes: () => {
    try {
      return JSON.parse(localStorage.getItem('localQuizzes')) || [];
    } catch (error) {
      console.error('Error reading quizzes:', error);
      return [];
    }
  },

  getExams: () => {
    try {
      return JSON.parse(localStorage.getItem('localExams')) || [];
    } catch (error) {
      console.error('Error reading exams:', error);
      return [];
    }
  },

  // Ajouter d'autres méthodes au besoin
};