// src/pages/TermsPage.jsx
import React from 'react';

import NavHome from '../components/NavHome';
const TermsPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      padding: '40px 24px',
      color: '#f8fafc',
    }}>
      <NavHome />
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 24, color: '#a5b4fc' }}>
          Conditions d'utilisation
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          1. Acceptation des conditions
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          En utilisant NA2 Quiz, vous acceptez les présentes conditions d'utilisation.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          2. Description du service
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          NA2 Quiz est une plateforme d'apprentissage en ligne proposant des quiz
          générés par intelligence artificielle pour aider les utilisateurs à
          améliorer leurs connaissances.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          3. Compte utilisateur
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Vous êtes responsable de la confidentialité de vos identifiants.
          Toute activité sur votre compte est sous votre responsabilité.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          4. Contenu généré
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Les quiz et certificats générés sur NA2 Quiz sont destinés à un usage
          personnel et éducatif uniquement.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          5. Résiliation
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Nous nous réservons le droit de suspendre ou supprimer votre compte
          en cas de violation des présentes conditions.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          6. Contact
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          📧 contact@na2quizappschool.uk
        </p>
      </div>
    </div>
  );
};

export default TermsPage;