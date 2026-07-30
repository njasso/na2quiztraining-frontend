// backend/api/check-config.js
export default async function handler(req, res) {
  try {
    // Vérifier si la clé API DeepSeek est configurée
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    const isConfigured = !!apiKey && apiKey.length > 10;
    
    res.status(200).json({
      configured: isConfigured,
      message: isConfigured ? 'API DeepSeek connectée' : 'API DeepSeek non configurée',
      models: ['deepseek-chat', 'deepseek-coder'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur check-config:', error);
    res.status(500).json({
      configured: false,
      error: error.message,
      message: 'Erreur lors de la vérification'
    });
  }
}