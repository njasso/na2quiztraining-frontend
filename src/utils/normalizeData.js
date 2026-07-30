// src/utils/normalizeData.js

/**
 * Normalise une question quel que soit son format source
 * Supporte:
 * - Format MongoDB direct
 * - Format questionsData.js
 * - Format des examens
 */
export const normalizeQuestion = (q) => {
  if (!q) return null;
  
  return {
    // Identifiant
    id: q._id || q.id || `temp-${Date.now()}-${Math.random()}`,
    
    // Texte de la question
    text: q.question || q.text || 'Question sans texte',
    
    // Options
    options: q.options || [],
    
    // Réponse correcte
    correctAnswer: q.answer || q.correctAnswer || '',
    
    // Métadonnées académiques
    domain: q.domain || q.domaine || 'Général',
    category: q.category || q.categorie || q.sousDomaine || '',
    level: q.level || q.niveau || '',
    subject: q.subject || q.matiere || q.matière || '',
    
    // Points
    points: q.points || 1,
    
    // Explication
    explanation: q.explanation || '',
    
    // Type de question
    type: q.type || q.questionType || 'single',
    
    // Métadonnées supplémentaires
    createdAt: q.createdAt || q.created_at || new Date().toISOString(),
    difficulty: q.difficulty || 'Moyen'
  };
};

/**
 * Normalise un tableau de questions
 */
export const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];
  return questions.map(normalizeQuestion).filter(q => q !== null);
};

/**
 * Normalise un examen
 */
export const normalizeExam = (exam) => {
  if (!exam) return null;
  
  return {
    id: exam._id || exam.id,
    title: exam.title || 'Examen sans titre',
    domain: exam.domain || exam.domaine || 'Général',
    category: exam.category || exam.categorie || exam.sousDomaine || '',
    level: exam.level || exam.niveau || '',
    subject: exam.subject || exam.matiere || exam.matière || '',
    duration: exam.duration || 60,
    totalPoints: exam.totalPoints || 0,
    totalQuestions: exam.questions?.length || 0,
    passingScore: exam.passingScore || 70,
    questions: normalizeQuestions(exam.questions),
    createdAt: exam.createdAt || exam.created_at || new Date().toISOString(),
    createdBy: exam.createdBy || exam.userId || null
  };
};