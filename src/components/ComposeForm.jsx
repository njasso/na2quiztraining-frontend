import { useState } from 'react';
import axios from 'axios';

export default function ComposeForm() {
  const [formData, setFormData] = useState({
    domain: 'Éducatif',
    level: '',
    specialty: '',
    subject: '',
    generationMode: 'IA',
    questions: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/exams', formData);
      alert('Épreuve sauvegardée avec succès');
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Champs domaine, niveau, matière, etc. */}
      <button type="submit">Sauvegarder</button>
    </form>
  );
}
