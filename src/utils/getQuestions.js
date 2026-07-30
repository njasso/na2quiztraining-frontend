const getQuestions = () => {
  try {
    console.log('Chemin d\'accès:', 
      formData.domain, 
      formData.subDomain, 
      formData.level, 
      formData.subject
    );
    
    const domainData = getQuestionsData()[formData.domain];
    const subDomainData = domainData?.[formData.subDomain];
    const levelData = subDomainData?.[formData.level];
    const questions = levelData?.[formData.subject] || [];

    console.log('Questions trouvées:', questions);
    return questions.slice(0, 10);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return [];
  }
};