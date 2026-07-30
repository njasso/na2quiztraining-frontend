// src/components/QuestionCard.jsx - Version corrigée
import React from 'react';

const QuestionCard = ({ question, index, userAnswer = [], onAnswerSelect, showResults }) => {
  // Normalisation des données de la question
  const questionText = question.text || question.question || 'Question sans texte';
  const questionOptions = question.options || [];
  const questionType = question.questionType || 'single';
  
  // Pour les questions à choix unique, userAnswer est un index ou une valeur
  // Pour les questions à choix multiples, userAnswer est un tableau d'index
  const isSelected = (optionIndex) => {
    if (questionType === 'single') {
      return userAnswer === optionIndex;
    }
    return userAnswer.includes(optionIndex);
  };
  
  const isCorrect = (option) => option.isCorrect || false;

  const handleClick = (optionIndex) => {
    if (!showResults) {
      onAnswerSelect(index, optionIndex);
    }
  };

  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
        <span style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#6366f1',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginRight: 12,
        }}>
          {index + 1}
        </span>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 500,
          color: '#f8fafc',
          lineHeight: 1.5,
          margin: 0,
          flex: 1,
        }}>
          {questionText}
        </h3>
        {question.points && (
          <span style={{
            padding: '4px 8px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid #f59e0b',
            borderRadius: 12,
            color: '#f59e0b',
            fontSize: '0.7rem',
            fontWeight: 600,
          }}>
            {question.points} pts
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: 44 }}>
        {questionOptions.map((option, i) => {
          const selected = isSelected(i);
          const correct = isCorrect(option);
          const optionText = typeof option === 'string' ? option : option.text;
          
          let bgColor = 'rgba(255,255,255,0.02)';
          let borderColor = 'rgba(99,102,241,0.2)';
          let textColor = '#94a3b8';

          if (showResults) {
            if (correct) {
              bgColor = 'rgba(16,185,129,0.1)';
              borderColor = '#10b981';
              textColor = '#10b981';
            } else if (selected && !correct) {
              bgColor = 'rgba(239,68,68,0.1)';
              borderColor = '#ef4444';
              textColor = '#ef4444';
            }
          } else if (selected) {
            bgColor = 'rgba(99,102,241,0.15)';
            borderColor = '#6366f1';
            textColor = '#a5b4fc';
          }

          return (
            <div
              key={i}
              onClick={() => handleClick(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                cursor: showResults ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type={questionType === 'single' ? 'radio' : 'checkbox'}
                checked={selected}
                onChange={() => handleClick(i)}
                disabled={showResults}
                style={{
                  marginRight: 12,
                  accentColor: showResults 
                    ? (correct ? '#10b981' : '#ef4444')
                    : '#6366f1',
                  width: 16,
                  height: 16,
                }}
              />
              <span style={{ color: textColor, flex: 1 }}>{optionText}</span>
              
              {showResults && correct && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {showResults && selected && !correct && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;