const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { nom, email, motdepasse, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email déjà utilisé." });

    const hashedPassword = await bcrypt.hash(motdepasse, 10);
    const newUser = new User({ nom, email, motdepasse: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "Utilisateur créé avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});
