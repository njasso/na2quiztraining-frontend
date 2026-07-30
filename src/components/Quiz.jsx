import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import questionsData from '../data/questionsData';
import { getExplanation } from '../data/explanations';
import { generatePDFReport } from '../utils/export';

// 🔧 Optionnel : config image ou formules
const MEDIA_CONFIG = {
  basePath: '/assets/images/'
};

// 🔧 Si tu veux intégrer MathJax plus tard
const MathJax = ({ formula }) => <div>{formula}</div>;

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();

const Quiz = () => {
  const { domain, level, subject } = useParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  const fetchedQuestions = questionsData(
    normalize(domain),
    level.trim(),
    subject.trim()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (index, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [index]: answer,
    }));
  };

  const calculateScore = () => {
    let newScore = 0;
    fetchedQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        newScore += (q.difficulty || 1) * 10;
      }
    });
    setScore(newScore);
  };

  const handleSubmit = () => {
    calculateScore();
    generatePDFReport({
      userAnswers,
      quizData: fetchedQuestions,
      score,
      timeLeft,
    });
  };

  if (!fetchedQuestions || fetchedQuestions.length === 0) {
    return <div>Aucune question disponible pour ce quiz.</div>;
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>{subject} - {level}</h2>
        <div className="timer">Temps restant: {formatTime(timeLeft)}</div>
      </div>

      {fetchedQuestions.map((q, index) => (
        <div key={index} className="question-card">
          <h3>Question {index + 1}</h3>
          <div className="question-content">{renderQuestionContent(q)}</div>
          <div className="options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(index, opt)}
                className={userAnswers[index] === opt ? 'selected' : ''}
              >
                {opt}
              </button>
            ))}
          </div>
          {userAnswers[index] && (
            <div className="explanation">
              {q.a !== undefined && q.b !== undefined
                ? getExplanation('MATH', q.a, q.b)
                : null}
            </div>
          )}
        </div>
      ))}

      <button onClick={handleSubmit} className="submit-btn">
        Soumettre le Quiz
      </button>
    </div>
  );
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderQuestionContent(question) {
  switch (question.type) {
    case 'image':
      return (
        <img
          src={`${MEDIA_CONFIG.basePath}${question.image}`}
          alt="Question"
        />
      );
    case 'formula':
      return <MathJax formula={question.formula} />;
    default:
      return <p>{question.question}</p>;
  }
}

export default Quiz;
