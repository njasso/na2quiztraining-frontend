// src/pages/AIGenerator.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import NavHome from '../components/NavHome';
const AIGeneratorPage = () => {
  const [level, setLevel] = useState('');
  const [domain, setDomain] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, domain, subject }),
      });

      const data = await response.json();
      setGeneratedQuestions(data.questions || []);
    } catch (error) {
      console.error("Erreur lors de la génération", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/questions/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: generatedQuestions }),
      });

      const data = await response.json();
      alert(data.message || "Questions enregistrées !");
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Questions Générées", 10, 10);

    generatedQuestions.forEach((q, i) => {
      const y = 20 + i * 30;
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${q.question}`, 10, y);
      q.options.forEach((opt, j) => {
        doc.text(`   ${String.fromCharCode(65 + j)}. ${opt}`, 12, y + (j + 1) * 6);
      });
    });

    doc.save("questions_ai.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <NavHome />
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-6">🧠 Générateur de Quiz par IA</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            className="border border-gray-300 rounded px-3 py-2"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">Niveau</option>
            <option value="Primaire">Primaire</option>
            <option value="Secondaire">Secondaire</option>
            <option value="Universitaire">Universitaire</option>
            <option value="Professionnel">Professionnel</option>
          </select>

          <input
            type="text"
            placeholder="Domaine"
            className="border border-gray-300 rounded px-3 py-2"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />

          <input
            type="text"
            placeholder="Matière"
            className="border border-gray-300 rounded px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Génération en cours..." : "Générer les questions"}
        </button>

        {generatedQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">📋 Questions générées :</h2>
            <ul className="space-y-4">
              {generatedQuestions.map((q, index) => (
                <li key={index} className="border rounded p-3 bg-gray-50">
                  <strong>Q{index + 1} :</strong> {q.question}
                  <ul className="ml-4 mt-2 list-disc">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {/* ✅ Boutons déplacés à l'intérieur du bloc conditionnel */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                💾 Enregistrer dans la base
              </button>

              <button
                onClick={handleExportPDF}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
              >
                🖨️ Exporter en PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGeneratorPage;