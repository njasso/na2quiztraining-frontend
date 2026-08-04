// src/utils/examVisibility.js
//
// Gère le champ `visibility` d'une épreuve — voir document de
// recommandations, section 7 (Gestion des Épreuves et Quiz) :
//   - 'public'   : visible par tout apprenant du niveau/matière correspondant
//   - 'assigned' : visible uniquement par les apprenants listés dans
//                  `assignedTo` (email ou matricule)
//   - 'private'  : visible uniquement par son auteur (brouillon/test)
//
// Le code d'épreuve (ex: EDU-MAT-TC-A427) permet de partager une épreuve
// "assignée" ou "publique" par lien/QR code sans devoir lister chaque
// apprenant nommément.

export const EXAM_VISIBILITY = {
  PUBLIC: 'public',
  ASSIGNED: 'assigned',
  PRIVATE: 'private',
};

export const EXAM_VISIBILITY_LABELS = {
  [EXAM_VISIBILITY.PUBLIC]: 'Publique — visible par tous les apprenants du niveau',
  [EXAM_VISIBILITY.ASSIGNED]: 'Assignée — visible uniquement par les apprenants listés',
  [EXAM_VISIBILITY.PRIVATE]: 'Privée — visible uniquement par vous (brouillon)',
};

/**
 * Génère un code d'épreuve court et lisible à partir du référentiel.
 * Format : DOMAINECODE-MATIERECODE-NIVEAU-XXXX (ex: EDU-MAT-TC-A427)
 */
export function generateExamCode(domaineCode = 'EXM', matiereCode = 'GEN', niveauNom = '') {
  const niveauAbrev = (niveauNom || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'NIV';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${domaineCode}-${matiereCode}-${niveauAbrev}-${suffix}`;
}

/**
 * Transforme une saisie libre (une ligne ou une virgule par apprenant :
 * email ou matricule) en tableau propre, dédupliqué.
 */
export function parseAssignedList(raw) {
  if (!raw) return [];
  return [...new Set(
    raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  )];
}

/**
 * Un apprenant a-t-il le droit de voir cette épreuve ?
 * `user` : le compte courant. `exam` : { visibility, assignedTo, createdBy }.
 * Les rôles exemptés (formateur/admin) passent toujours — géré par
 * educationScope.isScopeExemptRole côté appelant, pas ici.
 */
export function canViewExam(user, exam) {
  if (!exam) return false;
  const visibility = exam.visibility || (exam.isPublic === false ? EXAM_VISIBILITY.PRIVATE : EXAM_VISIBILITY.PUBLIC);

  if (visibility === EXAM_VISIBILITY.PUBLIC) return true;

  const authorId = exam.createdBy?._id || exam.createdBy?.id || exam.createdBy;
  const userId = user?._id || user?.id;
  if (authorId && userId && String(authorId) === String(userId)) return true; // l'auteur voit toujours son épreuve

  if (visibility === EXAM_VISIBILITY.ASSIGNED) {
    const assigned = (exam.assignedTo || []).map((a) => String(a).toLowerCase());
    const candidates = [user?.email, user?.matricule].filter(Boolean).map((s) => String(s).toLowerCase());
    return candidates.some((c) => assigned.includes(c));
  }

  return false; // 'private' et non-auteur
}
