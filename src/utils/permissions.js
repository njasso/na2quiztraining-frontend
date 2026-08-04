// src/utils/permissions.js
//
// Matrice de permissions centralisée — conforme au document de
// recommandations (section 10.3). Source unique de vérité pour toute
// vérification "ce rôle a-t-il le droit de faire X ?" côté frontend.
//
// ⚠️ Comme pour educationScope.js, ceci est un filet de sécurité UX : le
// backend doit appliquer la même matrice sur chaque endpoint concerné,
// sinon un appel API direct contourne tout.

export const PERMISSIONS = {
  // Questions
  CREATE_QUESTION: ['formateur', 'admin', 'superadmin'],
  VALIDATE_QUESTION: ['admin', 'superadmin'],
  EDIT_QUESTION: ['admin', 'superadmin', 'author'], // 'author' = vérifié séparément (voir hasPermission)
  DELETE_QUESTION: ['admin', 'superadmin'],

  // Quiz / Épreuves
  CREATE_QUIZ: ['formateur', 'admin', 'superadmin'],
  PUBLISH_QUIZ: ['formateur', 'admin', 'superadmin'],
  ASSIGN_QUIZ: ['formateur', 'admin', 'superadmin'],
  TAKE_QUIZ: ['user', 'formateur', 'admin', 'superadmin'],

  // Utilisateurs
  VIEW_USERS: ['admin', 'superadmin'],
  EDIT_USER: ['admin', 'superadmin'],
  PROMOTE_USER: ['admin', 'superadmin'],
  DELETE_USER: ['admin', 'superadmin'],

  // Exports
  EXPORT_RESULTS: ['formateur', 'admin', 'superadmin'],
  EXPORT_ALL: ['admin', 'superadmin'],

  // Configuration
  VIEW_CONFIG: ['admin', 'superadmin'],
  EDIT_CONFIG: ['superadmin'],
};

/**
 * @param {string} userRole - le rôle de l'utilisateur courant
 * @param {string} permission - une clé de PERMISSIONS
 * @param {object} [context] - { authorId, resourceAuthorId } pour la
 *   règle spéciale 'author' (ex: EDIT_QUESTION autorisé à son propre auteur
 *   même s'il n'est pas admin — utile si un formateur veut corriger une de
 *   ses questions encore en attente de validation).
 */
export function hasPermission(userRole, permission, context = {}) {
  const allowed = PERMISSIONS[permission] || [];
  if (allowed.includes(userRole)) return true;
  if (
    allowed.includes('author') &&
    context.authorId &&
    context.resourceAuthorId &&
    String(context.authorId) === String(context.resourceAuthorId)
  ) {
    return true;
  }
  return false;
}

/** Raccourci pratique : hasPermission(user?.role, permission, ...) */
export function userCan(user, permission, context = {}) {
  return hasPermission(user?.role, permission, {
    authorId: user?._id || user?.id,
    ...context,
  });
}
