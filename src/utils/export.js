import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png'; // Chemin vers votre logo
import { generatePDFReport } from '../utils/export';

export const generatePDFReport = (quizData, userAnswers, userInfo, timer) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const totalQuestions = quizData.length;
  const correctAnswers = quizData.reduce((acc, q, index) => 
    userAnswers[index] === q.answer ? acc + 1 : acc, 0);

  // Configuration de la page
  doc.setFont('helvetica');
  doc.setFontSize(10);

  // En-tête avec logo
  doc.addImage(logo, 'PNG', 15, 10, 30, 30);
  doc.setFontSize(18);
  doc.text('Rapport détaillé du Quiz', 55, 25);
  doc.setFontSize(12);
  doc.text(`Généré le : ${date}`, 55, 35);

  // Informations utilisateur
  autoTable(doc, {
    startY: 45,
    head: [['Nom', 'Niveau', 'Matière', 'Durée', 'Score']],
    body: [[
      `${userInfo.firstName} ${userInfo.lastName}`,
      quizData[0].level,
      quizData[0].subject,
      formatTime(timer),
      `${correctAnswers}/${totalQuestions}`
    ]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Détail des questions
  autoTable(doc, {
    startY: 75,
    head: [
      ['#', 'Question', 'Votre réponse', 'Bonne réponse', 'Statut', 'Difficulté']
    ],
    body: quizData.map((q, index) => [
      index + 1,
      q.question.substring(0, 40) + '...', // Raccourcir le texte
      userAnswers[index] || 'Non répondue',
      q.answer,
      userAnswers[index] === q.answer ? '✅' : '❌',
      '⭐'.repeat(q.difficulty)
    ]),
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 }
    },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Pied de page
  doc.setFontSize(8);
  doc.text(
    `QuizÉdu - Rapport généré automatiquement - Page 1/1`, 
    15, 
    doc.internal.pageSize.height - 10
  );

  doc.save(`quiz-report-${date}.pdf`);
};

// Fonction utilitaire pour le formatage du temps
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m${secs.toString().padStart(2, '0')}s`;
};

const handleSubmit = () => {
  generatePDFReport(
    quizData,
    userAnswers,
    { firstName, lastName },
    timeLeft
  );
};