// src/pages/admin/ImportQuestions.jsx - Version ULTIME AVEC CORRECTIONS
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, FileText, Download, X, AlertCircle,
  Loader, Database, Trash2, FileSpreadsheet, FileJson, Eye,
  ArrowLeft, Home, Tag, Layers, BookOpen, Clock, Bookmark,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saveQuestions } from '../../services/api';
import toast from 'react-hot-toast';
import DOMAIN_DATA from '../../data/domainConfig';

import NavHome from '../../components/NavHome';
const ImportQuestions = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [invalidQuestions, setInvalidQuestions] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Vérifier les droits
  if (!hasRole('ADMIN_DELEGUE') && !hasRole('ADMIN_SYSTEME')) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05071a, #0a0f2e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <NavHome />
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444',
          borderRadius: 12,
          padding: 20,
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <AlertCircle size={24} />
          <p>Accès non autorisé. Rôle ADMIN_DELEGUE requis.</p>
        </div>
      </div>
    );
  }

  // ==================== FONCTIONS DE RECHERCHE DES IDs ====================
  
  // ══════════════════════════════════════════════════════════
  // RÉSOLVEURS ROBUSTES — insensibles aux accents, à la casse,
  // aux espaces multiples ; acceptent ID direct, code ou libellé
  // ══════════════════════════════════════════════════════════

  // "Éducatif " → "educatif" | "1ère" → "1ere" | "Mathématiques" → "mathematiques"
  const slug = (str = '') =>
    String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // retire les accents
      .replace(/[.']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Correspondance partielle SÛRE : le libellé du référentiel contient
  // l'entrée, OU l'entrée contient le libellé en MOT ENTIER
  // (évite « alchimie » → « chimie »)
  const partialMatch = (refName, input) => {
    const r = slug(refName);
    const n = slug(input);
    if (!r || !n || n.length < 3) return false;
    if (r.includes(n)) return true;
    const esc = r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^| )${esc}( |$)`).test(n);
  };

  const findDomainId = (domaineNom) => {
    if (!domaineNom) return '';
    const raw = String(domaineNom).trim();
    // ID direct ("1", "2", "3")
    if (DOMAIN_DATA[raw]) return raw;
    const n = slug(raw);
    // 1) nom ou code exact (sans accents)
    for (const [id, d] of Object.entries(DOMAIN_DATA)) {
      if (slug(d.nom) === n || slug(d.code) === n) return String(id);
    }
    // 2) alias fréquents
    const alias = { 'culturel': '3', 'culture': '3', 'spiritualite': '3', 'pro': '2', 'professionnel': '2', 'education': '1', 'educatif': '1' };
    if (alias[n]) return alias[n];
    // 3) correspondance partielle
    for (const [id, d] of Object.entries(DOMAIN_DATA)) {
      if (partialMatch(d.nom, raw)) return String(id);
    }
    return '';
  };

  const findSousDomaineId = (domainId, sousDomaineNom) => {
    if (!domainId || !sousDomaineNom) return '';
    const domain = DOMAIN_DATA[domainId];
    if (!domain) return '';
    const raw = String(sousDomaineNom).trim();
    if (domain.sousDomaines?.[raw]) return raw;   // ID direct
    const n = slug(raw);
    for (const [id, sd] of Object.entries(domain.sousDomaines || {})) {
      if (slug(sd.nom) === n || slug(sd.code) === n) return String(id);
    }
    for (const [id, sd] of Object.entries(domain.sousDomaines || {})) {
      if (partialMatch(sd.nom, raw)) return String(id);
    }
    const mappings = {
      'primaire': '11', 'secondaire general': '12', 'secondaire': '12',
      'technique': '13', 'secondaire technique': '13',
      'primary': '1A', 'gce ordinary': '1B', 'gce advanced': '1C',
      'superieur': '1D', 'universitaire': '1D', 'universite': '1D',
    };
    return mappings[n] || '';
  };

  // Recherche d'un niveau DANS un sous-domaine précis
  const findLevelIn = (domainId, sousDomaineId, levelNom) => {
    const sd = DOMAIN_DATA[domainId]?.sousDomaines?.[sousDomaineId];
    if (!sd?.levels || !levelNom) return '';
    const raw = String(levelNom).trim();
    const byId = sd.levels.find(l => String(l.id) === raw);
    if (byId) return String(byId.id);
    const n = slug(raw);
    const exact = sd.levels.find(l => slug(l.nom) === n);
    if (exact) return String(exact.id);
    const partial = sd.levels.find(l => partialMatch(l.nom, raw));
    return partial ? String(partial.id) : '';
  };

  // Recherche GLOBALE d'un niveau dans tout le domaine → { id, sdId }
  const findLevelGlobal = (domainId, levelNom) => {
    const domain = DOMAIN_DATA[domainId];
    if (!domain || !levelNom) return { id: '', sdId: '' };
    for (const [sdId] of Object.entries(domain.sousDomaines || {})) {
      const id = findLevelIn(domainId, sdId, levelNom);
      if (id) return { id, sdId };
    }
    return { id: '', sdId: '' };
  };

  const findLevelId = (domainId, sousDomaineId, levelNom) => {
    if (!levelNom) return '';
    if (domainId && sousDomaineId) {
      const found = findLevelIn(domainId, sousDomaineId, levelNom);
      if (found) return found;
    }
    if (domainId) {
      const g = findLevelGlobal(domainId, levelNom);
      if (g.id) return g.id;
    }
    return '';
  };

  // Recherche d'une matière DANS un sous-domaine précis
  const findMatiereIn = (domainId, sousDomaineId, matiereNom) => {
    const sd = DOMAIN_DATA[domainId]?.sousDomaines?.[sousDomaineId];
    if (!sd?.matieres || !matiereNom) return '';
    const raw = String(matiereNom).trim();
    const byId = sd.matieres.find(m => String(m.id) === raw);
    if (byId) return String(byId.id);
    const n = slug(raw);
    const exact = sd.matieres.find(m => slug(m.nom) === n || slug(m.code) === n);
    if (exact) return String(exact.id);
    const partial = sd.matieres.find(m => partialMatch(m.nom, raw));
    return partial ? String(partial.id) : '';
  };

  // Recherche GLOBALE d'une matière dans tout le domaine → { id, sdId }
  const findMatiereGlobal = (domainId, matiereNom) => {
    const domain = DOMAIN_DATA[domainId];
    if (!domain || !matiereNom) return { id: '', sdId: '' };
    for (const [sdId] of Object.entries(domain.sousDomaines || {})) {
      const id = findMatiereIn(domainId, sdId, matiereNom);
      if (id) return { id, sdId };
    }
    return { id: '', sdId: '' };
  };

  const findMatiereId = (domainId, sousDomaineId, matiereNom) => {
    if (!matiereNom) return '';
    if (domainId && sousDomaineId) {
      const found = findMatiereIn(domainId, sousDomaineId, matiereNom);
      if (found) return found;
    }
    if (domainId) {
      const g = findMatiereGlobal(domainId, matiereNom);
      if (g.id) return g.id;
    }
    return '';
  };

  const getMatiereCode = (domainId, sousDomaineId, matiereId) => {
    if (!domainId || !sousDomaineId || !matiereId) return '';
    const sd = DOMAIN_DATA[domainId]?.sousDomaines?.[sousDomaineId];
    const matiere = sd?.matieres?.find(m => String(m.id) === String(matiereId));
    return matiere?.code || '';
  };

  // ==================== ADAPTATION DES DONNÉES EXISTANTES ====================
  
  const adaptQuestionData = (q) => {
    const adapted = { ...q };
    
    // ✅ Si bonOpRep existe mais pas correctAnswer
    if (adapted.bonOpRep !== undefined && adapted.bonOpRep !== null && !adapted.correctAnswer) {
      if (adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0) {
        const index = parseInt(adapted.bonOpRep);
        if (index >= 0 && index < adapted.options.length) {
          adapted.correctAnswer = adapted.options[index];
        }
      }
    }
    
    // ✅ Si correctAnswer existe mais pas bonOpRep
    if (adapted.correctAnswer && (adapted.bonOpRep === undefined || adapted.bonOpRep === null)) {
      if (adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0) {
        let index = adapted.options.findIndex(opt => opt === adapted.correctAnswer);
        if (index === -1) {
          const trimmed = adapted.correctAnswer.trim();
          index = adapted.options.findIndex(opt => opt.trim() === trimmed);
        }
        if (index === -1) {
          // Essayer une correspondance insensible à la casse
          const lowerAnswer = adapted.correctAnswer.toLowerCase().trim();
          index = adapted.options.findIndex(opt => opt.toLowerCase().trim() === lowerAnswer);
        }
        adapted.bonOpRep = index >= 0 ? index : 0;
      }
    }
    
    // ✅ Si ni l'un ni l'autre, mais que les options existent
    if ((adapted.bonOpRep === undefined || adapted.bonOpRep === null) && 
        (!adapted.correctAnswer) && 
        adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0) {
      adapted.bonOpRep = 0;
      adapted.correctAnswer = adapted.options[0];
    }
    
    return adapted;
  };

  // ==================== VALIDATION DES QUESTIONS ====================
  
  const validateQuestionData = (q, index) => {
    const errors = [];
    const warnings = [];
    
    if (!q.libQuestion || q.libQuestion.trim().length < 5) {
      errors.push('Libellé de question trop court (min 5 caractères)');
    }
    
    if (!q.options || q.options.length < 2) {
      errors.push('Au moins 2 options requises');
    }
    
    // ✅ CORRECTION : Vérifier correctAnswer OU bonOpRep
    const hasCorrectAnswer = q.correctAnswer || q.bonOpRep !== undefined || q.bonOpRep !== null || q.bonOpRep >= 0;
    
    if (!hasCorrectAnswer) {
      errors.push('Réponse correcte manquante');
    } else if (q.options && q.options.length > 0) {
      if (q.correctAnswer && !q.options.includes(q.correctAnswer)) {
        // Vérifier avec trim
        const trimmedAnswer = q.correctAnswer.trim();
        if (!q.options.some(opt => opt.trim() === trimmedAnswer)) {
          errors.push('La réponse correcte n\'existe pas dans les options');
        }
      }
      if (q.bonOpRep !== undefined && q.bonOpRep >= 0 && q.bonOpRep >= q.options.length) {
        errors.push(`L'index de la réponse correcte (${q.bonOpRep}) est invalide (max: ${q.options.length - 1})`);
      }
    }
    
    if (!q.matiere || q.matiere.trim().length < 2) {
      errors.push('Matière requise');
    }
    
    if (!q.niveau || q.niveau.trim().length < 1) {
      errors.push('Niveau requis');
    }
    
    if (!q.domaine || q.domaine.trim().length < 2) {
      errors.push('Domaine requis');
    }

    // ✅ Résolution du référentiel : messages précis si un élément
    // du fichier ne correspond à rien dans le référentiel codifié
    if (q.domaine && !q.domaineId) {
      errors.push(`Domaine « ${q.domaine} » introuvable dans le référentiel`);
    }
    if (q.domaineId && q.sousDomaine !== undefined && !q.sousDomaineId) {
      errors.push(`Sous-domaine « ${q.sousDomaine || '(vide)'} » introuvable — précisez-le ou utilisez un niveau connu`);
    }
    if (q.domaineId && q.niveau && !q.niveauId) {
      errors.push(`Niveau « ${q.niveau} » introuvable dans le référentiel (sous-domaine : ${q.sousDomaine || '?'})`);
    }
    if (q.domaineId && q.matiere && !q.matiereId) {
      errors.push(`Matière « ${q.matiere} » introuvable dans le référentiel (sous-domaine : ${q.sousDomaine || '?'})`);
    }
    if (q.matiereId && !q.matiereCode) {
      errors.push(`Code matière introuvable pour « ${q.matiere} »`);
    }
    
    // Warnings (non bloquants)
    if (q.points && (q.points < 0.5 || q.points > 10)) {
      warnings.push('Les points doivent être entre 0.5 et 10');
    }
    
    if (q.tempsMin && (q.tempsMin < 0.5 || q.tempsMin > 10)) {
      warnings.push('Le temps doit être entre 0.5 et 10 minutes');
    }
    
    const validDifficulties = ['facile', 'moyen', 'difficile', 'très difficile'];
    if (q.difficulty && !validDifficulties.includes(q.difficulty.toLowerCase())) {
      warnings.push(`Difficulté invalide. Utilisez: ${validDifficulties.join(', ')}`);
    }
    
    return { errors, warnings };
  };

  // ==================== NORMALISATION DES QUESTIONS ====================
  
  const normalizeQuestion = (q) => {
    // Adapter les données existantes
    const adapted = adaptQuestionData(q);
    
    let domaineId = findDomainId(adapted.domaine) || '1'; // défaut : Éducatif si domaine absent
    let sousDomaineId = findSousDomaineId(domaineId, adapted.sousDomaine);
    let niveauId = findLevelId(domaineId, sousDomaineId, adapted.niveau);
    let matiereId = findMatiereId(domaineId, sousDomaineId, adapted.matiere);

    // ✅ RÉALIGNEMENT CROISÉ : si le sous-domaine est absent ou incohérent,
    // on le déduit du couple (niveau, matière) via la recherche globale
    if (!sousDomaineId || !niveauId || !matiereId) {
      const gLevel = findLevelGlobal(domaineId, adapted.niveau);
      const gMat = findMatiereGlobal(domaineId, adapted.matiere);

      // Cas idéal : niveau et matière pointent vers le même sous-domaine
      if (gLevel.sdId && gLevel.sdId === gMat.sdId) {
        sousDomaineId = gLevel.sdId;
        niveauId = gLevel.id;
        matiereId = gMat.id;
      } else {
        // Sinon on privilégie le sous-domaine du niveau, puis on y recherche la matière
        if (!sousDomaineId && gLevel.sdId) sousDomaineId = gLevel.sdId;
        if (!sousDomaineId && gMat.sdId) sousDomaineId = gMat.sdId;
        if (sousDomaineId) {
          if (!niveauId) niveauId = findLevelIn(domaineId, sousDomaineId, adapted.niveau);
          if (!matiereId) matiereId = findMatiereIn(domaineId, sousDomaineId, adapted.matiere);
        }
      }
    }

    // ✅ LIBELLÉS OFFICIELS recalculés depuis les IDs résolus
    // (la base stocke ainsi toujours l'orthographe du référentiel)
    if (domaineId && DOMAIN_DATA[domaineId]) {
      adapted.domaine = DOMAIN_DATA[domaineId].nom;
    }
    const sdObj = DOMAIN_DATA[domaineId]?.sousDomaines?.[sousDomaineId];
    if (sdObj) adapted.sousDomaine = sdObj.nom;
    const lvlObj = sdObj?.levels?.find(l => String(l.id) === String(niveauId));
    if (lvlObj) adapted.niveau = lvlObj.nom;
    const matObj = sdObj?.matieres?.find(m => String(m.id) === String(matiereId));
    if (matObj) adapted.matiere = matObj.nom;

    const domaineCode = DOMAIN_DATA[domaineId]?.code || '';
    const sousDomaine = DOMAIN_DATA[domaineId]?.sousDomaines?.[sousDomaineId];
    const sousDomaineCode = sousDomaine?.code || '';
    const matiereCode = getMatiereCode(domaineId, sousDomaineId, matiereId);
    
    // ✅ CORRECTION : Gérer correctAnswer ET bonOpRep
    let correctAnswer = adapted.correctAnswer || adapted.answer || '';
    let bonOpRep = -1;
    
    // Si bonOpRep est fourni, l'utiliser
    if (adapted.bonOpRep !== undefined && adapted.bonOpRep !== null && adapted.bonOpRep >= 0) {
      bonOpRep = parseInt(adapted.bonOpRep);
      // Si bonOpRep est valide, en déduire correctAnswer
      if (adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0 && bonOpRep < adapted.options.length) {
        correctAnswer = adapted.options[bonOpRep];
      }
    } 
    // Sinon, si correctAnswer est fourni, trouver son index
    else if (correctAnswer && adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0) {
      bonOpRep = adapted.options.findIndex(opt => opt === correctAnswer);
      if (bonOpRep === -1) {
        const trimmedAnswer = correctAnswer.trim();
        bonOpRep = adapted.options.findIndex(opt => opt.trim() === trimmedAnswer);
      }
      if (bonOpRep === -1) {
        const lowerAnswer = correctAnswer.toLowerCase().trim();
        bonOpRep = adapted.options.findIndex(opt => opt.toLowerCase().trim() === lowerAnswer);
      }
    }
    
    // Si toujours pas trouvé, prendre l'option 0 par défaut
    if (bonOpRep === -1 && adapted.options && Array.isArray(adapted.options) && adapted.options.length > 0) {
      bonOpRep = 0;
      correctAnswer = adapted.options[0];
    }
    
    // Si correctAnswer est vide mais bonOpRep est valide
    if (!correctAnswer && bonOpRep >= 0 && adapted.options && Array.isArray(adapted.options) && adapted.options.length > bonOpRep) {
      correctAnswer = adapted.options[bonOpRep];
    }
    
    let typeQuestion = adapted.typeQuestion || 1;
    if (adapted.type === 'multiple') typeQuestion = 2;
    else if (adapted.type === 'single') typeQuestion = 1;
    
    // ✅ DÉTERMINER selectedDomaine
    let selectedDomaine = adapted.selectedDomaine || adapted.domaine || 'Éducatif';
    if (selectedDomaine === '1') selectedDomaine = 'Éducatif';
    else if (selectedDomaine === '2') selectedDomaine = 'Professionnel';
    else if (selectedDomaine === '3') selectedDomaine = 'Culturel';
    
    // Nettoyer les options
    let options = [];
    if (adapted.options && Array.isArray(adapted.options)) {
      options = adapted.options.map(opt => String(opt).trim()).filter(Boolean);
    } else if (adapted.options && typeof adapted.options === 'string') {
      options = adapted.options.split('|').map(opt => opt.trim()).filter(Boolean);
    }
    if (options.length === 0) {
      options = ['Option A', 'Option B', 'Option C'];
    }
    
    return {
      // ✅ selectedDomaine en PREMIER champ
      selectedDomaine: selectedDomaine,
      
      // Référentiel avec IDs
      // ✅ PLUS DE FALLBACKS SILENCIEUX : si un ID n'est pas résolu,
      // il reste vide et la question est rejetée avec un message précis
      // (au lieu d'être classée à tort en Français / 3e / Secondaire)
      domaineId,
      domaine: adapted.domaine || '',
      domaineCode,
      sousDomaineId,
      sousDomaine: adapted.sousDomaine || '',
      sousDomaineCode,
      niveauId,
      niveau: adapted.niveau || '',
      matiereId,
      matiere: adapted.matiere || '',
      matiereCode,
      libChapitre: adapted.libChapitre || adapted.chapitre || adapted.chapter || 'Général',
      
      // Contenu
      libQuestion: adapted.libQuestion || adapted.question || adapted.text || '',
      options: options,
      correctAnswer: correctAnswer,
      bonOpRep: bonOpRep >= 0 ? bonOpRep : 0,
      
      // Métadonnées
      typeQuestion: typeQuestion,
      type: typeQuestion === 2 ? 'multiple' : 'single',
      points: parseFloat(adapted.points) || 1,
      explanation: adapted.explanation || '',
      tempsMin: parseFloat(adapted.tempsMin) || 1,
      tempsMinParQuestion: parseInt(adapted.tempsMinParQuestion) || 60,
      difficulty: adapted.difficulty || 'moyen',
      tags: Array.isArray(adapted.tags) ? adapted.tags : (adapted.tags ? adapted.tags.split(',').map(t => t.trim()) : []),
      
      // Auteur
      matriculeAuteur: user?.matricule || user?.email || '',
      createdBy: user?._id,
      status: 'pending'
    };
  };

  // ==================== PARSING DES FICHIERS ====================
  
  const parseCSV = (text) => {
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.substring(1);
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    let separator = ',';
    const firstLine = lines[0];
    if (firstLine.includes(';') && !firstLine.includes(',')) {
      separator = ';';
    }
    
    const headers = lines[0].split(separator).map(h => h.replace(/^["']|["']$/g, '').trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = [];
      let inQuote = false;
      let currentValue = '';
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === separator && !inQuote) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      if (values.length >= headers.length && values.some(v => v)) {
        const obj = {};
        headers.forEach((header, idx) => {
          const value = values[idx] ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
          if (header === 'options') {
            obj[header] = value ? value.split('|').map(v => v.trim()) : [];
          } else if (header === 'tags') {
            obj[header] = value ? value.split(',').map(v => v.trim()) : [];
          } else if (header === 'points' || header === 'typeQuestion' || header === 'tempsMin') {
            obj[header] = parseFloat(value) || 1;
          } else if (header === 'bonOpRep' || header === 'correctAnswerIndex') {
            obj['bonOpRep'] = parseInt(value) || 0;
          } else if (header === 'correctAnswer') {
            obj['correctAnswer'] = value;
          } else {
            obj[header] = value;
          }
        });
        
        // ✅ S'assurer que bonOpRep est présent
        if (obj.correctAnswer && obj.options && obj.bonOpRep === undefined) {
          obj.bonOpRep = obj.options.findIndex(opt => opt === obj.correctAnswer);
          if (obj.bonOpRep === -1) {
            const trimmed = obj.correctAnswer.trim();
            obj.bonOpRep = obj.options.findIndex(opt => opt.trim() === trimmed);
          }
          if (obj.bonOpRep === -1) {
            const lower = obj.correctAnswer.toLowerCase().trim();
            obj.bonOpRep = obj.options.findIndex(opt => opt.toLowerCase().trim() === lower);
          }
          if (obj.bonOpRep === -1) {
            obj.bonOpRep = 0;
          }
        }
        
        if (obj.question && !obj.libQuestion) obj.libQuestion = obj.question;
        if (obj.chapitre && !obj.libChapitre) obj.libChapitre = obj.chapitre;
        if (obj.text && !obj.libQuestion) obj.libQuestion = obj.text;
        
        data.push(obj);
      }
    }
    return data;
  };

  const parseJSON = (text) => {
    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    } catch (e) {
      throw new Error('Format JSON invalide: ' + e.message);
    }
  };

  // ==================== GESTION DU FICHIER ====================
  
  const handleFileUpload = (file) => {
    setError(null);
    setInvalidQuestions([]);
    setValidationWarnings([]);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let rawData = [];
        
        if (file.name.endsWith('.csv')) {
          rawData = parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          rawData = parseJSON(content);
        } else {
          throw new Error('Format non supporté. Utilisez CSV ou JSON');
        }
        
        if (rawData.length === 0) {
          throw new Error('Aucune donnée trouvée dans le fichier');
        }
        
        // ✅ Normaliser chaque question avec adaptation des données existantes
        const normalizedData = rawData.map(q => normalizeQuestion(q));
        
        // Valider les données
        const validationErrors = [];
        const warningsList = [];
        const validData = [];
        
        normalizedData.forEach((q, idx) => {
          const { errors, warnings } = validateQuestionData(q, idx);
          if (errors.length > 0) {
            validationErrors.push({
              index: idx,
              question: q.libQuestion?.substring(0, 50) || 'Question sans libellé',
              errors
            });
          } else {
            validData.push(q);
          }
          if (warnings.length > 0) {
            warningsList.push({
              index: idx,
              question: q.libQuestion?.substring(0, 50) || 'Question sans libellé',
              warnings
            });
          }
        });
        
        if (validationErrors.length > 0) {
          setInvalidQuestions(validationErrors);
          console.log('❌ Erreurs de validation:', validationErrors);
        }
        
        if (warningsList.length > 0) {
          setValidationWarnings(warningsList);
        }
        
        if (validData.length === 0) {
          throw new Error('Aucune question valide trouvée. Vérifiez le format et les champs obligatoires.');
        }
        
        setPreviewData(validData);
        
        let message = `${validData.length} questions chargées`;
        if (validationErrors.length > 0) {
          message += `, ${validationErrors.length} ignorées (erreurs)`;
        }
        if (warningsList.length > 0) {
          message += `, ${warningsList.length} avec avertissements`;
        }
        toast.success(message);
        
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  // ==================== IMPORT DES QUESTIONS ====================
  
  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Aucune question à importer');
      return;
    }
    
    setImporting(true);
    try {
      const questionsWithAuthor = previewData.map(q => ({
        ...q,
        selectedDomaine: q.selectedDomaine || q.domaine || 'Éducatif',
        matriculeAuteur: user?.matricule || user?.email || '',
        createdBy: user?._id,
        dateCreation: new Date().toISOString(),
        status: 'pending'
      }));
      
      const result = await saveQuestions({ questions: questionsWithAuthor });
      
      if (result.success) {
        toast.success(`${previewData.length} questions importées avec succès (en attente de validation)`);
        setPreviewData([]);
        setFile(null);
        setInvalidQuestions([]);
        setValidationWarnings([]);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }
    } catch (err) {
      console.error('Erreur import:', err);
      toast.error(err.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  // ==================== TEMPLATES ====================
  
  const downloadTemplate = () => {
    const template = [
      ["selectedDomaine", "domaine", "sousDomaine", "niveau", "matiere", "libChapitre", "libQuestion", "options", "bonOpRep", "correctAnswer", "typeQuestion", "points", "tempsMin", "explanation", "difficulty", "tags"],
      ["Éducatif", "Éducatif", "Secondaire Général (Francophone)", "3e", "Géographie", "Chapitre 1: Le Cameroun", "Quelle est la capitale du Cameroun ?", "Douala|Yaoundé|Garoua|Bafoussam", "1", "Yaoundé", "1", "1", "1", "Yaoundé est la capitale politique", "facile", "géographie,capitale"],
      ["Éducatif", "Éducatif", "Primaire (Francophone)", "CM2", "Mathématiques", "Chapitre 2: Addition", "Combien font 5 + 3 ?", "6|7|8|9", "2", "8", "1", "1", "1", "5 + 3 = 8", "facile", "maths,addition"],
      ["Éducatif", "Éducatif", "Secondaire Général (Francophone)", "4e", "Français", "Grammaire", "Quelle est la nature du mot 'beau' ?", "Adjectif|Nom|Verbe|Adverbe", "0", "Adjectif", "1", "1", "1", "Beau est un adjectif qualificatif", "facile", "grammaire,adjectif"],
      ["Professionnel", "Professionnel", "Management", "MBA", "Management de la Qualité", "Processus Qualité", "Qu'est-ce qu'un indicateur qualité ?", "Outil de mesure|Un document|Une procédure|Un objectif", "0", "Outil de mesure", "1", "1", "1", "Un indicateur qualité est un outil de mesure", "moyen", "qualité,indicateur"]
    ];
    
    const csvContent = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'questions_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template CSV téléchargé');
  };

  const downloadJsonTemplate = () => {
    const template = [
      {
        selectedDomaine: "Éducatif",
        domaine: "Éducatif",
        sousDomaine: "Secondaire Général (Francophone)",
        niveau: "3e",
        matiere: "Géographie",
        libChapitre: "Chapitre 1: Le Cameroun",
        libQuestion: "Quelle est la capitale du Cameroun ?",
        options: ["Douala", "Yaoundé", "Garoua", "Bafoussam"],
        bonOpRep: 1,
        correctAnswer: "Yaoundé",
        typeQuestion: 1,
        points: 1,
        tempsMin: 1,
        explanation: "Yaoundé est la capitale politique du Cameroun",
        difficulty: "facile",
        tags: ["géographie", "capitale"]
      },
      {
        selectedDomaine: "Éducatif",
        domaine: "Éducatif",
        sousDomaine: "Primaire (Francophone)",
        niveau: "CM2",
        matiere: "Mathématiques",
        libChapitre: "Chapitre 2: Addition",
        libQuestion: "Combien font 5 + 3 ?",
        options: ["6", "7", "8", "9"],
        bonOpRep: 2,
        correctAnswer: "8",
        typeQuestion: 1,
        points: 1,
        tempsMin: 1,
        explanation: "5 + 3 = 8",
        difficulty: "facile",
        tags: ["maths", "addition"]
      },
      {
        selectedDomaine: "Professionnel",
        domaine: "Professionnel",
        sousDomaine: "Management",
        niveau: "MBA",
        matiere: "Management de la Qualité",
        libChapitre: "Processus Qualité",
        libQuestion: "Qu'est-ce qu'un indicateur qualité ?",
        options: ["Outil de mesure", "Un document", "Une procédure", "Un objectif"],
        bonOpRep: 0,
        correctAnswer: "Outil de mesure",
        typeQuestion: 1,
        points: 1,
        tempsMin: 1,
        explanation: "Un indicateur qualité est un outil de mesure",
        difficulty: "moyen",
        tags: ["qualité", "indicateur"]
      }
    ];
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'questions_template.json';
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template JSON téléchargé');
  };

  // ==================== RENDU PRINCIPAL ====================

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      padding: '24px'
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/questions')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12,
                padding: 12,
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <ArrowLeft size={20} />
              <span style={{ fontSize: '0.8rem' }}>Retour</span>
            </motion.button>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '4px 12px', background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20,
                marginBottom: 8
              }}>
                <Database size={14} color="#10b981" />
                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>
                  IMPORT EN MASSE
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                Importer des questions
              </h1>
              <p style={{ color: '#64748b' }}>
                Importez un lot de questions depuis un fichier CSV ou JSON
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Panneau d'import */}
          <div style={{
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20,
            padding: 24
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc', marginBottom: 20 }}>
              <Upload size={18} style={{ display: 'inline', marginRight: 8 }} />
              Importer un fichier
            </h2>

            {/* Zone de dépôt */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
                  setFile(file);
                  handleFileUpload(file);
                } else {
                  toast.error('Format non supporté. Utilisez CSV ou JSON');
                }
              }}
              style={{
                border: `2px dashed ${dragActive ? '#10b981' : 'rgba(16,185,129,0.3)'}`,
                borderRadius: 12, padding: '40px 20px', textAlign: 'center',
                background: dragActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: 24
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload size={40} color={dragActive ? '#10b981' : '#64748b'} style={{ marginBottom: 12 }} />
              <p style={{ color: '#f8fafc', fontSize: '0.9rem', marginBottom: 4 }}>
                {file ? file.name : 'Glissez un fichier ici ou cliquez pour sélectionner'}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.7rem' }}>
                Formats supportés: CSV, JSON
              </p>
              <input
                id="fileInput"
                type="file"
                accept=".csv,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFile(file);
                    handleFileUpload(file);
                  }
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                borderRadius: 8, padding: 12, marginBottom: 24,
                color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Erreurs de validation */}
            {invalidQuestions.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                borderRadius: 8, padding: 12, marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <X size={16} color="#ef4444" />
                  <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem' }}>
                    {invalidQuestions.length} question(s) ignorée(s) (erreurs bloquantes)
                  </span>
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {invalidQuestions.slice(0, 5).map((inv, idx) => (
                    <div key={idx} style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 4 }}>
                      • "{inv.question}": {inv.errors.join(', ')}
                    </div>
                  ))}
                  {invalidQuestions.length > 5 && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                      ... et {invalidQuestions.length - 5} autre(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Avertissements de validation */}
            {validationWarnings.length > 0 && (
              <div style={{
                background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b',
                borderRadius: 8, padding: 12, marginBottom: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.8rem' }}>
                    {validationWarnings.length} question(s) avec avertissements (non bloquants)
                  </span>
                </div>
                <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                  {validationWarnings.slice(0, 3).map((warn, idx) => (
                    <div key={idx} style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 4 }}>
                      • "{warn.question}": {warn.warnings.join(', ')}
                    </div>
                  ))}
                  {validationWarnings.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                      ... et {validationWarnings.length - 3} autre(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Templates */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 12, fontWeight: 600 }}>
                Télécharger un modèle
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={downloadTemplate} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8, color: '#60a5fa', cursor: 'pointer'
                }}>
                  <FileSpreadsheet size={14} /> CSV Template
                </button>
                <button onClick={downloadJsonTemplate} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: 8, color: '#a78bfa', cursor: 'pointer'
                }}>
                  <FileJson size={14} /> JSON Template
                </button>
              </div>
            </div>

            {/* Bouton d'import */}
            {previewData.length > 0 && (
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    flex: 1, padding: '12px',
                    background: importing ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: 10, color: 'white',
                    fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {importing ? <Loader size={16} className="animate-spin" /> : <Database size={16} />}
                  {importing ? 'Import en cours...' : `Importer ${previewData.length} question(s)`}
                </motion.button>
                
                <button onClick={() => { setPreviewData([]); setFile(null); }} style={{
                  padding: '12px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10,
                  color: '#ef4444', cursor: 'pointer'
                }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Prévisualisation */}
          <div style={{
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20,
            padding: 24, overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                <FileText size={18} style={{ display: 'inline', marginRight: 8 }} />
                Prévisualisation ({previewData.length})
              </h2>
              {previewData.length > 0 && (
                <span style={{ background: '#10b981', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', color: '#fff' }}>
                  Prêt pour import
                </span>
              )}
            </div>

            {previewData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: 12 }}>
                <FileText size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p>Aucune question chargée</p>
                <p style={{ fontSize: '0.7rem', marginTop: 8 }}>
                  Importez un fichier CSV ou JSON pour prévisualiser les questions
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 8 }}>
                {previewData.map((q, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12, marginBottom: 12, position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ background: 'rgba(16,185,129,0.3)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} /> {q.selectedDomaine || q.domaine}
                      </span>
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={10} /> {q.matiere}
                      </span>
                      <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={10} /> {q.niveau}
                      </span>
                      <span style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={10} /> {q.domaine}
                      </span>
                      {q.sousDomaine && (
                        <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem' }}>
                          {q.sousDomaine}
                        </span>
                      )}
                      {q.libChapitre && (
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Bookmark size={10} />
                          {q.libChapitre.length > 30 ? q.libChapitre.substring(0, 27) + '...' : q.libChapitre}
                        </span>
                      )}
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {q.tempsMin} min
                      </span>
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} /> Index: {q.bonOpRep}
                      </span>
                    </div>
                    
                    <p style={{ color: '#f8fafc', fontSize: '0.85rem', marginBottom: 8, fontWeight: 500 }}>
                      {idx + 1}. {q.libQuestion}
                    </p>
                    
                    {q.options && q.options.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6 }}>
                        <span style={{ color: '#94a3b8' }}>Options: </span>
                        {q.options.slice(0, 3).map((opt, i) => (
                          <span key={i} style={{ 
                            marginRight: 4,
                            color: opt === q.correctAnswer ? '#10b981' : '#94a3b8'
                          }}>
                            {opt}{i < Math.min(2, q.options.length - 1) ? ', ' : ''}
                          </span>
                        ))}
                        {q.options.length > 3 && <span>+{q.options.length - 3}</span>}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                      ✓ Réponse: {q.correctAnswer} (index: {q.bonOpRep})
                    </div>
                    
                    <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: 6 }}>
                      {q.points} point{q.points > 1 ? 's' : ''} • {q.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/questions')}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: 12, color: 'white', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
            }}
          >
            <Eye size={18} /> Aller à la validation
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            style={{
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Home size={18} /> Tableau de bord
          </motion.button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ImportQuestions;