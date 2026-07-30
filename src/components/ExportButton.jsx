import React from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const ExportButton = ({ questions }) => {
  const generatePdf = () => {
    const docDefinition = {
      content: [
        { text: 'Questionnaire Généré', style: 'header' },
        ...questions.map((q, index) => ({
          columns: [
            { text: `${index + 1}. ${q.question}`, width: '*' },
            { text: `Réponse : ${q.answer}`, width: 100 }
          ],
          margin: [0, 5]
        }))
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] }
      }
    };

    pdfMake.createPdf(docDefinition).download('questionnaire.pdf');
  };

  return (
    <button 
      onClick={generatePdf}
      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
    >
      Télécharger PDF
    </button>
  );
};

export default ExportButton;