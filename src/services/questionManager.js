// src/services/questionManager.js
export const getUniqueQuestions = async (criteria) => {
  const db = await openDB('ExamsDB');
  const tx = db.transaction('questions', 'readonly');
  const store = tx.objectStore('questions');
  
  const allQuestions = await store.getAll();
  return allQuestions
    .filter(q => 
      q.domain === criteria.domaine &&
      q.level === criteria.level &&
      q.usedCount < MAX_USAGE_PER_QUESTION
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, criteria.numberOfQuestions);
};