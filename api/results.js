const express = require('express');
const router = express.Router();
const QuizResult = require('../models/QuizResult');
const { authenticateToken } = require('../middlewares/auth');

// Enregistrer un résultat
router.post('/', authenticateToken, async (req, res) => {
  const { domaine, score, total } = req.body;
  const result = new QuizResult({ user: req.user.id, domaine, score, total });
  await result.save();
  res.json({ message: 'Résultat enregistré' });
});

// Obtenir l’historique d’un utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  const results = await QuizResult.find({ user: req.user.id }).sort({ date: -1 });
  res.json(results);
});

module.exports = router;
