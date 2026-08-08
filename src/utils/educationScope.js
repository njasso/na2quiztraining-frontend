// src/utils/educationScope.js
//
// Source unique de vérité pour tout ce qui touche au "périmètre" éducatif
// d'un utilisateur (domaine / sous-domaine (filière+cycle) / niveau / matières
// autorisées). Utilisé partout où l'app doit répondre à la question :
// "cet utilisateur a-t-il le droit de VOIR / GÉNÉRER / RÉPONDRE à ceci ?"
//
// Le profil utilisateur (retourné par /auth/verify, /auth/login,
// /users/:id) doit contenir un objet `education` :
//
//   user.education = {
//     domainId: "1",
//     sousDomaineId: "12",      // ex: "Secondaire Général (Francophone)"
//     levelId: "124",           // ex: "3e"
//     matieresAutorisees: [],   // optionnel : sous-ensemble de matières
//                                // choisi par l'utilisateur/le parent parmi
//                                // celles du sous-domaine. Vide = toutes.
//   }
//
// Tant que le backend n'a pas ce champ, `hasEducationScope(user)` renvoie
// false et l'app doit rediriger vers /choisir-niveau (voir
// RequireEducationLevel.jsx).

import {
  getAllSousDomaines,
  getAllLevels,
  getAllMatieres,
  getSousDomaineNom,
  getLevelNom,
  getAllDomaines,
} from '../data/domainConfig';

// ═══════════════════════════════════════════════════════════════
// DÉCOUVERTE (audit stratégique 2.2) : un élève de 3e curieux d'économie,
// un Terminale qui veut apprendre du management — le programme scolaire
// strict (domaine 1, verrouillé par sous-domaine+niveau) ne le permet pas,
// à raison : on ne mélange pas la logique de scope pédagogique avec de la
// découverte hors-cursus. Les domaines 2 (Professionnel) et 3 (Spiritualité
// et Culture Camerounaise) sont par nature transversaux — aucun programme
// officiel de classe n'en dépend, donc aucun risque à les rendre visibles
// à TOUS les utilisateurs authentifiés, quel que soit leur niveau verrouillé.
// Recommandation appliquée : un onglet "Découverte" séparé plutôt qu'un
// mélange avec le fil du programme officiel (voir DecouvertePage.jsx).
export const DISCOVERY_DOMAIN_IDS = ['2', '3'];

/** Un domaine est-il en accès libre (hors verrouillage de scope) ? */
export const isDiscoveryDomain = (domainId) =>
  DISCOVERY_DOMAIN_IDS.includes(String(domainId));

/** Les domaines proposés dans l'onglet Découverte, en accès libre pour tous. */
export const getDiscoveryDomains = () =>
  getAllDomaines().filter((d) => isDiscoveryDomain(d.id));

/** Un utilisateur a-t-il déjà choisi son niveau d'étude ? */
export function hasEducationScope(user) {
  return !!(
    user &&
    user.education &&
    user.education.domainId &&
    user.education.sousDomaineId &&
    user.education.levelId
  );
}

/**
 * Les rôles "métier" (formateur, modérateur, admin, superadmin) créent ou
 * gèrent du contenu multi-niveaux : on ne leur impose pas un périmètre
 * unique, mais on continue de leur proposer un niveau "par défaut" pour
 * pré-remplir les formulaires.
 *
 * Décision produit (voir rapport d'audit, section 5) : le formateur est
 * exempté au même titre que l'admin/modérateur, car il enseigne
 * généralement à plusieurs classes/niveaux à la fois.
 */
export function isScopeExemptRole(user) {
  return ['formateur', 'admin', 'superadmin', 'moderator'].includes(user?.role);
}

/**
 * Renvoie la liste des matières que l'utilisateur a le droit d'utiliser
 * pour CE sous-domaine précis. Si l'utilisateur n'a pas encore de scope
 * (compte non configuré) ou est exempté, on renvoie tout (l'appelant doit
 * de toute façon bloquer l'accès en amont via RequireEducationLevel).
 */
export function getAllowedMatieres(user, domainId, sousDomaineId) {
  const all = getAllMatieres(domainId, sousDomaineId);
  if (!user?.education) return all;

  const allowedIds = user.education.matieresAutorisees;
  if (!Array.isArray(allowedIds) || allowedIds.length === 0) return all;

  const allowedSet = new Set(allowedIds.map(String));
  return all.filter((m) => allowedSet.has(String(m.id)));
}

/**
 * Un utilisateur "élève/étudiant" standard ne doit voir QUE son propre
 * sous-domaine (filière+cycle). Un formateur/admin peut tout voir.
 * Renvoie la liste des sous-domaines visibles pour un domaine donné.
 */
export function getVisibleSousDomaines(user, domainId) {
  const all = getAllSousDomaines(domainId);
  if (isScopeExemptRole(user)) return all;
  if (!hasEducationScope(user)) return []; // forcé par RequireEducationLevel

  return all.filter((sd) => String(sd.id) === String(user.education.sousDomaineId));
}

/**
 * Idem pour les niveaux (classes) à l'intérieur d'un sous-domaine : un
 * élève ne doit voir que SA classe, pas tout le cycle.
 */
export function getVisibleLevels(user, domainId, sousDomaineId) {
  const all = getAllLevels(domainId, sousDomaineId);
  if (isScopeExemptRole(user)) return all;
  if (!hasEducationScope(user)) return [];

  return all.filter((l) => String(l.id) === String(user.education.levelId));
}

/** Libellé humain du scope courant, ex: "3e — Secondaire Général (Francophone)" */
export function formatScopeLabel(user) {
  if (!hasEducationScope(user)) return 'Niveau non défini';
  const { domainId, sousDomaineId, levelId } = user.education;
  const level = getLevelNom(domainId, sousDomaineId, levelId);
  const sousDomaine = getSousDomaineNom(domainId, sousDomaineId);
  return `${level} — ${sousDomaine}`;
}

/**
 * Vérifie qu'une question/quiz/examen (qui porte domainId/sousDomaineId/
 * levelId/matiereId) est bien dans le périmètre de l'utilisateur avant de
 * l'afficher ou de le proposer. À utiliser côté liste (filter) ET côté
 * accès direct par URL (garde défensive, ex: /exam/:id).
 */
export function isContentInScope(user, content) {
  if (!content) return false;
  if (isScopeExemptRole(user)) return true;

  // ✅ Le contenu Découverte (domaines 2/3) est visible par tous, y compris
  // un utilisateur dont le scope est verrouillé sur le domaine 1 — c'est
  // tout le principe de la découverte hors-cursus (voir DISCOVERY_DOMAIN_IDS).
  const contentDomain = content.domainId ?? content.domain;
  if (isDiscoveryDomain(contentDomain)) return true;

  if (!hasEducationScope(user)) return false;

  const { domainId, sousDomaineId, levelId } = user.education;
  const contentSousDomaine = content.sousDomaineId ?? content.sousDomaine;
  const contentLevel = content.levelId ?? content.level;

  const sameDomain = !contentDomain || String(contentDomain) === String(domainId);
  const sameSousDomaine = !contentSousDomaine || String(contentSousDomaine) === String(sousDomaineId);
  // Le niveau exact n'est pas toujours renseigné sur le contenu (ex: quiz
  // valable pour tout le cycle) : on ne bloque que s'il est précisé ET
  // différent.
  const sameLevel = !contentLevel || String(contentLevel) === String(levelId);

  return sameDomain && sameSousDomaine && sameLevel;
}
