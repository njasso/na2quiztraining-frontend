// src/services/api/deepseekAPI.js
const API_KEY = process.env.REACT_APP_DEEPSEEK_KEY;
const BASE_URL = 'https://api.deepseek.com/v1';

export const generateWithAI = async (promptData) => {
  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
        max_tokens: promptData.maxTokens || 1500,
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API DeepSeek:', error);
    throw error;
  }
};

export const analyzeResults = async (examData) => {
  // Implémentation alternative si nécessaire
};