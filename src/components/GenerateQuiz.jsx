const handleGenerate = async () => {
  try {
    const response = await axios.post('/generate-quiz', {
      domain: selectedDomain,
      subject: selectedSubject,
      level: selectedLevel,
      questionCount: 15
    });

    if (response.data.success) {
      setGeneratedQuiz(response.data.quiz);
      setError(null);
    } else {
      setError(response.data.message);
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Erreur inconnue';
    
    setError(errorMessage);
    console.error('Détails erreur:', {
      config: error.config,
      response: error.response?.data
    });
  }
};