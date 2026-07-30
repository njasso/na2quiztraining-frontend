// scripts/checkQuestionsFormat.mjs
import questionsData from '../src/data/questionsData.js';

console.log('🔍 ANALYSE DU FORMAT DES QUESTIONS');
console.log('═══════════════════════════════════\n');

let totalQuestions = questionsData.length;
let validQuestions = 0;
let invalidQuestions = [];
let formatIssues = {
  missingText: 0,
  missingOptions: 0,
  missingCorrectAnswer: 0,
  optionsNotArray: 0,
  other: 0
};

questionsData.forEach((q, index) => {
  let isValid = true;
  let issues = [];

  // Vérifier chaque champ requis
  if (!q.question && !q.text) {
    isValid = false;
    formatIssues.missingText++;
    issues.push('texte manquant');
  }

  if (!q.options) {
    isValid = false;
    formatIssues.missingOptions++;
    issues.push('options manquantes');
  } else if (!Array.isArray(q.options)) {
    isValid = false;
    formatIssues.optionsNotArray++;
    issues.push('options pas un tableau');
  }

  if (!q.correctAnswer) {
    isValid = false;
    formatIssues.missingCorrectAnswer++;
    issues.push('réponse correcte manquante');
  }

  if (!isValid) {
    invalidQuestions.push({
      index: index + 1,
      question: q.question || q.text || 'Sans titre',
      issues: issues
    });
  } else {
    validQuestions++;
  }
});

console.log(`📊 TOTAL: ${totalQuestions} questions`);
console.log(`✅ Valides: ${validQuestions}`);
console.log(`❌ Invalides: ${invalidQuestions.length}\n`);

console.log('📋 RÉPARTITION DES PROBLÈMES:');
console.log(`   - Texte manquant: ${formatIssues.missingText}`);
console.log(`   - Options manquantes: ${formatIssues.missingOptions}`);
console.log(`   - Options pas un tableau: ${formatIssues.optionsNotArray}`);
console.log(`   - Réponse correcte manquante: ${formatIssues.missingCorrectAnswer}\n`);

if (invalidQuestions.length > 0) {
  console.log('🔍 PREMIÈRES QUESTIONS INVALIDES (max 10):');
  invalidQuestions.slice(0, 10).forEach(q => {
    console.log(`   ${q.index}. "${q.question.substring(0, 50)}..." - Problèmes: ${q.issues.join(', ')}`);
  });
}

// Afficher un exemple de question valide
const firstValid = questionsData.find(q => q.question && q.options && Array.isArray(q.options) && q.correctAnswer);
if (firstValid) {
  console.log('\n✅ EXEMPLE DE QUESTION VALIDE:');
  console.log(JSON.stringify(firstValid, null, 2));
}