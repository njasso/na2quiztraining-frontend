// src/utils/filters.js
//
// Point d'entrée "filtres" attendu par le document de recommandations
// (section 8.3 : buildQuestionFilters). Volontairement un simple habillage
// au-dessus de educationScope.js — la logique de périmètre ne doit vivre
// qu'à un seul endroit (educationScope.js) pour ne jamais diverger entre
// les deux modules.

import { hasEducationScope, isScopeExemptRole } from './educationScope';

/**
 * Construit l'objet de filtres à envoyer à l'API (banque de questions,
 * liste d'épreuves, etc.) selon le rôle et le périmètre de l'utilisateur.
 *
 * - Apprenant (et tout rôle non exempté) : verrouillé sur son propre
 *   domaine/sous-domaine/niveau ; matières restreintes si définies.
 * - Formateur/Admin/Modérateur (rôles exemptés) : filtres additionnels
 *   fournis en paramètre (ex: ceux choisis dans un formulaire de recherche),
 *   jamais imposés automatiquement.
 */
export function buildQuestionFilters(user, manualFilters = {}) {
  if (!isScopeExemptRole(user) && hasEducationScope(user)) {
    const filters = {
      domainId: user.education.domainId,
      sousDomaineId: user.education.sousDomaineId,
      levelId: user.education.levelId,
    };
    if (Array.isArray(user.education.matieresAutorisees) && user.education.matieresAutorisees.length > 0) {
      filters.matiereIds = user.education.matieresAutorisees;
    }
    return filters;
  }

  // Formateur / Admin / Modérateur : choix libre, transmis tel quel.
  const { domainId, sousDomaineId, levelId, matiereId } = manualFilters;
  return {
    ...(domainId && { domainId }),
    ...(sousDomaineId && { sousDomaineId }),
    ...(levelId && { levelId }),
    ...(matiereId && { matiereId }),
  };
}

/** Même principe pour la liste des épreuves (voir ExamsPage.jsx). */
export function buildExamFilters(user, manualFilters = {}) {
  return buildQuestionFilters(user, manualFilters);
}
