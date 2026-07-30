// src/pages/PrivacyPage.jsx
import React from 'react';

import NavHome from '../components/NavHome';
const PrivacyPage = () => {
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
          Politique de confidentialité
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
        
        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          1. Collecte des données
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          NA2 Quiz collecte les informations suivantes lors de l'utilisation de Facebook Login :
          nom, prénom, adresse email et photo de profil. Ces données sont utilisées uniquement
          pour personnaliser votre expérience sur la plateforme.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          2. Utilisation des données
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Vos données sont utilisées pour :
        </p>
        <ul style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          <li>Créer et gérer votre compte</li>
          <li>Suivre votre progression dans les quiz</li>
          <li>Générer des certificats personnalisés</li>
          <li>Vous envoyer des notifications liées à votre activité</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          3. Partage des données
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          NA2 Quiz ne vend ni ne partage vos données personnelles avec des tiers.
          Vos données restent strictement confidentielles.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          4. Suppression des données
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Vous pouvez demander la suppression de vos données à tout moment via
          votre profil ou en nous contactant à contact@na2quizappschool.uk.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          5. Cookies
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          NA2 Quiz utilise des cookies uniquement pour maintenir votre session
          de connexion et améliorer votre expérience utilisateur.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: 24, marginBottom: 12, color: '#f8fafc' }}>
          6. Contact
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Pour toute question concernant cette politique de confidentialité :
          <br />
          📧 contact@na2quizappschool.uk
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;