const EXAMS_KEY = 'exam_history';

export const database = {
  getExams: () => {
    const exams = localStorage.getItem(EXAMS_KEY);
    return exams ? JSON.parse(exams) : [];
  },

  saveExam: (exam) => {
    const exams = database.getExams();
    exams.push(exam);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  }
};
