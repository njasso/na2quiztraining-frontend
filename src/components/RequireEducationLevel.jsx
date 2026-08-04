// src/components/RequireEducationLevel.jsx
//
// À composer AVEC PrivateRoute (à l'intérieur) sur toute route où le
// contenu doit être scopé par niveau : /quizzes, /generate-quiz, /manual,
// /database, /exams, /create-exam, /leaderboard, /dashboard, etc.
//
// <PrivateRoute><RequireEducationLevel><QuizzesPage/></RequireEducationLevel></PrivateRoute>
//
// Un utilisateur avec un rôle "métier" (admin/superadmin/modérateur) n'est
// pas bloqué : il gère du contenu multi-niveaux par nature.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasEducationScope, isScopeExemptRole } from '../utils/educationScope';

const RequireEducationLevel = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return children; // PrivateRoute gère déjà l'absence d'auth

  if (isScopeExemptRole(user) || hasEducationScope(user)) {
    return children;
  }

  return <Navigate to="/choisir-niveau" state={{ from: location.pathname }} replace />;
};

export default RequireEducationLevel;
