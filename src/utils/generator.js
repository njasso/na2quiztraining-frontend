import { DIFFICULTY_LEVELS, QUESTION_TYPES } from '../data/config';

export class QuestionGenerator {
  constructor(subject, level) {
    this.subject = subject;
    this.level = level;
  }

  generate(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: this.generateId(i),
      ...this.generateQuestion(i),
      difficulty: this.calculateDifficulty(),
      type: this.determineType()
    }));
  }

  generateId(index) {
    return `${this.subject.slice(0, 3)}-${this.level}-${Date.now()}-${index}`;
  }

  calculateDifficulty() {
    const probabilities = DIFFICULTY_LEVELS[this.level];
    const rand = Math.random() * 100;
    return rand <= probabilities.easy ? 1 : 
           rand <= (probabilities.easy + probabilities.medium) ? 2 : 3;
  }

  determineType() {
    const types = Object.values(QUESTION_TYPES);
    return types[Math.floor(Math.random() * types.length)];
  }

  generateQuestion(index) {
    switch(this.subject) {
      case 'Mathématiques':
        return this.generateMathQuestion(index);
      case 'Histoire':
        return this.generateHistoryQuestion(index);
      // Ajouter d'autres matières...
    }
  }

  generateMathQuestion(index) {
    const a = Math.floor(Math.random() * 10 * (this.difficulty + 1));
    const b = Math.floor(Math.random() * 10 * (this.difficulty + 1));
    const operators = ['+', '-', '*', '/'];
    const op = operators[Math.floor(Math.random() * operators.length)];

    return {
      question: `Calculez ${a} ${op} ${b}`,
      answer: eval(`${a} ${op} ${b}`), // Attention: utiliser eval() avec précaution
      options: this.generateMathOptions(a, b, op),
      formula: `${a} ${op} ${b} = ?`
    };
  }

  generateMathOptions(a, b, op) {
    const correct = eval(`${a} ${op} ${b}`);
    return [
      correct,
      correct + Math.floor(Math.random() * 5) + 1,
      correct - Math.floor(Math.random() * 5) - 1,
      Math.floor(Math.random() * 100)
    ].sort(() => Math.random() - 0.5);
  }
}