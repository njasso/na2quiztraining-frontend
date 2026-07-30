export function validateAnswer(question, userAnswer) {
  switch(question.type) {
    case 'formula':
      return mathCompare(userAnswer, question.answer);
    case 'multiple-choice':
      return userAnswer === question.answer;
    default:
      return simpleValidation(question, userAnswer);
  }
}

function mathCompare(a, b) {
  // Implémentation d'une comparaison mathématique sécurisée
  try {
    return math.evaluate(a) === math.evaluate(b);
  } catch {
    return false;
  }
}