// Génère des questions aléatoires
function generateRandomQuestions(domaine, niveau, matiere, count = 40) {
  const questions = [];

  for (let i = 1; i <= count; i++) {
    questions.push({
      question: `Question ${i} en ${matiere} (${niveau}, ${domaine})`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      niveau,
      matiere,
      domaine,
    });
  }

  return questions;
}

module.exports = { generateRandomQuestions };
