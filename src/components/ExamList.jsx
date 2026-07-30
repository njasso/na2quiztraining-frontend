import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [filters, setFilters] = useState({ domain: '', level: '', subject: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await axios.get('/api/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Erreur de chargement des épreuves', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await axios.delete(`/api/exams/${id}`);
      setExams(exams.filter((exam) => exam._id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1); // reset page
  };

  const filteredExams = exams.filter((exam) => {
    return (
      (filters.domain === '' || exam.domain === filters.domain) &&
      (filters.level === '' || exam.level === filters.level) &&
      (filters.subject === '' || exam.subject.toLowerCase().includes(filters.subject.toLowerCase()))
    );
  });

  const paginatedExams = filteredExams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);

  const exportToPDF = (exam) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Épreuve - ${exam.subject}`, 10, 10);
    doc.setFontSize(12);

    let y = 20;
    exam.questions.forEach((q, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${q.question}`, 10, y);
      y += 6;
      q.options.forEach((opt, i) => {
        doc.text(`   ${String.fromCharCode(65 + i)}. ${opt}`, 14, y);
        y += 6;
      });
      y += 4;
    });

    doc.save(`Epreuve-${exam.subject}.pdf`);
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Épreuves enregistrées</h2>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select name="domain" value={filters.domain} onChange={handleFilterChange} className="border p-2 rounded">
          <option value="">Tous domaines</option>
          <option value="Éducatif">Éducatif</option>
          <option value="Professionnel">Professionnel</option>
        </select>
        <select name="level" value={filters.level} onChange={handleFilterChange} className="border p-2 rounded">
          <option value="">Tous niveaux</option>
          <option value="Primaire">Primaire</option>
          <option value="Secondaire">Secondaire</option>
          <option value="Université">Université</option>
        </select>
        <input
          type="text"
          name="subject"
          placeholder="Filtrer par matière"
          value={filters.subject}
          onChange={handleFilterChange}
          className="border p-2 rounded flex-1"
        />
      </div>

      {filteredExams.length === 0 ? (
        <p>Aucune épreuve trouvée.</p>
      ) : (
        <div className="grid gap-4">
          {paginatedExams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-xl shadow p-4 flex justify-between items-start"
            >
              <div>
                <p className="text-lg font-semibold">{exam.subject}</p>
                <p className="text-sm text-gray-500">
                  {exam.domain} – {exam.level} {exam.subLevel} {exam.specialty && `– ${exam.specialty}`}
                </p>
                <p className="text-sm text-gray-400">Mode : {exam.generationMode}</p>
                <p className="text-xs text-gray-400">Créé le : {new Date(exam.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedExam(exam)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Voir les détails"
                >
                  <Eye />
                </button>
                <button
                  onClick={() => exportToPDF(exam)}
                  className="text-green-600 hover:text-green-800"
                  title="Exporter en PDF"
                >
                  <FileDown />
                </button>
                <button
                  onClick={() => deleteExam(exam._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Supprimer"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Détail d'une épreuve */}
      {selectedExam && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-bold mb-2">Détails de l’épreuve</h3>
          <ul className="list-disc pl-6 space-y-2">
            {selectedExam.questions.map((q, i) => (
              <li key={i}>
                <strong>{q.question}</strong>
                <ul className="list-decimal ml-4">
                  {q.options.map((opt, idx) => (
                    <li key={idx}>{opt}</li>
                  ))}
                </ul>
                <p className="text-sm text-green-600">Réponse : {q.answer}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setSelectedExam(null)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
