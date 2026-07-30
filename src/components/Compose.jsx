import React, { useState } from "react";
import axios from "axios";



const Compose = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [textPreview, setTextPreview] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setQuestions([]);
    setTextPreview("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Veuillez sélectionner un fichier");

    const formData = new FormData();
    formData.append("document", file);

    try {
      setLoading(true);
      setError("");
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/compose`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setQuestions(response.data.questions || []);
      setTextPreview(response.data.documentText || "");
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Générer un quiz depuis un document</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="block w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Génération en cours..." : "Générer"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {textPreview && (
        <div className="mt-6 p-4 border bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Aperçu du texte extrait :</h2>
          <p className="whitespace-pre-wrap">{textPreview}</p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Questions générées :</h2>
          {questions.map((q, index) => (
            <div key={index} className="mb-4 p-4 border rounded bg-white shadow">
              <p className="font-medium">{index + 1}. {q.question}</p>
              <ul className="list-disc ml-6 mt-2">
                {q.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
              <p className="mt-2 text-green-600">Réponse correcte : <strong>{q.answer}</strong></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Compose;
