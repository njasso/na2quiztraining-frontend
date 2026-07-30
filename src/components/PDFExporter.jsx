export const generateExamPDF = (exam, results) => {
  const doc = new jsPDF();
  
  // En-tête avec logo
  const logo = new Image();
  logo.src = logoPdf;
  doc.addImage(logo, 'PNG', 10, 10, 30, 30);
  
  // Informations du candidat
  doc.setFontSize(12);
  doc.text(`Nom: ${exam.metadata.candidateInfo.name}`, 50, 20);
  doc.text(`Établissement: ${exam.metadata.candidateInfo.school}`, 50, 30);
  
  // Corps de l'examen
  exam.questions.forEach((q, index) => {
    const yPos = 50 + (index * 40);
    doc.text(`Question ${index + 1}: ${q.text}`, 10, yPos);
    doc.text(`Réponse: ${results.answers[q.id].join(', ')}`, 10, yPos + 10);
    doc.text(`Correct: ${q.correctAnswers.join(', ')}`, 10, yPos + 20);
  });
  
  doc.save(`exam-${exam.id}.pdf`);
};