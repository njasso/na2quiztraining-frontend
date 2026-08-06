// src/pages/Formateur/MesClasses.jsx
//
// Rattachement formateur ↔ apprenants (document de recommandations §4,
// strategie_circuits_utilisateurs.md §4). L'API existe déjà dans
// services/api.js (createClasse, getMyClasses, getClasseDetails,
// joinClasseByCode, removeClasseMember, regenerateClasseCode) — cette page
// est le premier écran à la consommer.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Copy, RefreshCw, X, ChevronRight,
  UserMinus, Loader, GraduationCap, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createClasse, getMyClasses, getClasseDetails,
  removeClasseMember, regenerateClasseCode,
} from '../../services/api';
import { getAllDomaines, getAllSousDomaines, getAllLevels } from '../../data/domainConfig';
import NavHome from '../../components/NavHome';

const MesClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyClasses();
      console.log('📦 Données des classes reçues:', data);
      setClasses(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Erreur chargement classes:', err);
      toast.error("Impossible de charger vos classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const openClasse = async (classe) => {
    setSelectedClasse(classe);
    setLoadingMembers(true);
    try {
      console.log('🔍 Ouverture de la classe:', classe._id || classe.id);
      
      const response = await getClasseDetails(classe._id || classe.id);
      console.log('📦 Réponse brute de getClasseDetails:', response);
      
      // ✅ EXTRACTION CORRECTE - Vérifier toutes les structures possibles
      let membres = [];
      
      // Structure 1: response.data.membres (la plus probable)
      if (response?.data?.membres && Array.isArray(response.data.membres)) {
        membres = response.data.membres;
        console.log('✅ Membres trouvés dans response.data.membres:', membres.length);
      }
      // Structure 2: response.membres
      else if (response?.membres && Array.isArray(response.membres)) {
        membres = response.membres;
        console.log('✅ Membres trouvés dans response.membres:', membres.length);
      }
      // Structure 3: response.data.data.membres
      else if (response?.data?.data?.membres && Array.isArray(response.data.data.membres)) {
        membres = response.data.data.membres;
        console.log('✅ Membres trouvés dans response.data.data.membres:', membres.length);
      }
      // Structure 4: response.data (si c'est directement un tableau)
      else if (Array.isArray(response?.data)) {
        membres = response.data;
        console.log('✅ Membres trouvés dans response.data (tableau):', membres.length);
      }
      // Structure 5: response (si c'est directement un tableau)
      else if (Array.isArray(response)) {
        membres = response;
        console.log('✅ Membres trouvés dans response (tableau):', membres.length);
      }
      
      // ✅ Si aucun membre trouvé, essayer d'extraire depuis la classe sélectionnée
      if (membres.length === 0 && classe.membres && Array.isArray(classe.membres)) {
        membres = classe.membres;
        console.log('✅ Membres trouvés dans classe.membres:', membres.length);
      }
      
      // ✅ Si aucun membre trouvé, essayer depuis classe.membresCount
      if (membres.length === 0 && (classe.membresCount > 0 || classe.membres?.length > 0)) {
        console.warn('⚠️ membresCount indique', classe.membresCount || classe.membres?.length, 'membres mais aucun membre trouvé');
        // On va essayer de rafraîchir les données
        toast.info('Rafraîchissement des données...');
        await fetchClasses();
        // Réessayer une fois
        const refreshedClasse = classes.find(c => (c._id || c.id) === (classe._id || classe.id));
        if (refreshedClasse?.membres) {
          membres = refreshedClasse.membres;
          console.log('✅ Membres trouvés après rafraîchissement:', membres.length);
        }
      }
      
      console.log(`👥 ${membres.length} membres extraits au total`);
      
      // ✅ Filtrer les membres actifs et extraire les données utilisateur
      const activeMembers = membres
        .filter(m => m.statut !== 'retire')
        .map(m => {
          // Si le membre a un apprenantId, utiliser les données de l'apprenant
          if (m.apprenantId) {
            return {
              ...m,
              _id: m.apprenantId._id || m.apprenantId.id || m._id,
              firstName: m.apprenantId.firstName || m.apprenantId.prenom || m.firstName || 'Inconnu',
              lastName: m.apprenantId.lastName || m.apprenantId.nom || m.lastName || '',
              email: m.apprenantId.email || m.email || '',
              // Garder une référence à l'apprenant original
              apprenant: m.apprenantId
            };
          }
          return m;
        });
      
      console.log(`✅ ${activeMembers.length} membres actifs extraits`);
      
      // ✅ Afficher les détails des membres pour déboguer
      activeMembers.forEach((m, i) => {
        console.log(`👤 Membre ${i + 1}:`, {
          id: m._id || m.id,
          nom: `${m.firstName || ''} ${m.lastName || ''}`,
          email: m.email
        });
      });
      
      setMembers(activeMembers);
      
      // ✅ Mettre à jour la classe sélectionnée avec les bons membres
      setSelectedClasse(prev => ({
        ...prev,
        membres: activeMembers,
        membresCount: activeMembers.length
      }));
      
    } catch (err) {
      console.error('❌ Erreur chargement membres:', err);
      toast.error("Impossible de charger les membres de cette classe.");
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedClasse) return;
    try {
      await removeClasseMember(selectedClasse._id || selectedClasse.id, userId);
      setMembers((prev) => prev.filter((m) => (m._id || m.id || m.apprenantId?._id || m.apprenantId?.id) !== userId));
      toast.success("Apprenant retiré de la classe.");
      // Rafraîchir les classes
      await fetchClasses();
    } catch (err) {
      toast.error("Impossible de retirer cet apprenant.");
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedClasse) return;
    try {
      const res = await regenerateClasseCode(selectedClasse._id || selectedClasse.id);
      const newCode = res?.code || res?.data?.code;
      if (newCode) {
        setSelectedClasse((prev) => ({ ...prev, code: newCode, codeInvitation: newCode }));
        setClasses((prev) => prev.map((c) =>
          (c._id || c.id) === (selectedClasse._id || selectedClasse.id) ? { ...c, code: newCode, codeInvitation: newCode } : c
        ));
        toast.success("Nouveau code généré. L'ancien code ne fonctionne plus.");
      }
    } catch (err) {
      toast.error("Impossible de régénérer le code.");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success('Code copié !');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      padding: 24,
    }}>
      <NavHome />
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/formateur/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 16, fontSize: '0.85rem',
          }}
        >
          <ArrowLeft size={16} /> Retour au tableau de bord
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={26} /> Mes classes
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>
              Rattachez vos apprenants pour leur assigner des épreuves et suivre leur progression.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
              borderRadius: 12, color: 'white', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={18} /> Nouvelle classe
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <Loader size={28} /> Chargement…
          </div>
        ) : classes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20,
          }}>
            <GraduationCap size={40} color="#64748b" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8' }}>Vous n'avez pas encore de classe. Créez-en une pour commencer à suivre vos apprenants.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {classes.map((c) => (
              <motion.div
                key={c._id || c.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => openClasse(c)}
                style={{
                  padding: 20, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 16, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '1.05rem' }}>{c.name || c.nom}</h3>
                  <ChevronRight size={18} color="#64748b" />
                </div>
                {c.description && (
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>{c.description}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>
                    {c.membresCount ?? c.membres?.length ?? 0} apprenant(s)
                  </span>
                  <code style={{
                    background: 'rgba(99,102,241,0.12)', padding: '4px 8px', borderRadius: 8,
                    color: '#c7d2fe', fontSize: '0.75rem',
                  }}>{c.codeInvitation || c.code}</code>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modale : création de classe */}
      <AnimatePresence>
        {showCreate && (
          <CreateClasseModal
            onClose={() => setShowCreate(false)}
            onCreated={(newClasse) => {
              setClasses((prev) => [newClasse, ...prev]);
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modale : détail d'une classe */}
      <AnimatePresence>
        {selectedClasse && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedClasse(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto',
                background: '#0f172a', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 20, padding: 28,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                  {selectedClasse.name || selectedClasse.nom}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => {
                      if (selectedClasse) {
                        openClasse(selectedClasse);
                      }
                    }}
                    title="Rafraîchir"
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => setSelectedClasse(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {selectedClasse.description && (
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>
                  {selectedClasse.description}
                </p>
              )}

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 12, marginBottom: 20,
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Code d'invitation</div>
                  <code style={{ color: '#a5b4fc', fontSize: '1rem', fontWeight: 600 }}>
                    {selectedClasse.codeInvitation || selectedClasse.code}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyCode(selectedClasse.codeInvitation || selectedClasse.code)} title="Copier"
                    style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                    <Copy size={15} />
                  </button>
                  <button onClick={handleRegenerateCode} title="Régénérer le code"
                    style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 10 }}>
                Apprenants ({members.length})
              </h3>
              
              {loadingMembers ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Chargement…</p>
              ) : members.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 20, 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: 12 
                }}>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Aucun apprenant pour l'instant. Partagez le code ci-dessus.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {members.map((m, idx) => {
                    // ✅ Extraire les données de l'apprenant avec toutes les possibilités
                    const user = m.apprenantId || m;
                    const userId = m._id || m.id || m.apprenantId?._id || m.apprenantId?.id || `user-${idx}`;
                    const firstName = user.firstName || user.prenom || 'Inconnu';
                    const lastName = user.lastName || user.nom || '';
                    const email = user.email || '';
                    
                    return (
                      <div key={userId} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                      }}>
                        <div>
                          <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                            {firstName} {lastName}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {email || 'Email non renseigné'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(userId)}
                          title="Retirer"
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateClasseModal = ({ onClose, onCreated }) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [domainId, setDomainId] = useState('');
  const [sousDomaineId, setSousDomaineId] = useState('');
  const [niveauId, setNiveauId] = useState('');
  const [saving, setSaving] = useState(false);

  const domaines = getAllDomaines();
  const sousDomaines = domainId ? getAllSousDomaines(domainId) : [];
  const niveaux = domainId && sousDomaineId ? getAllLevels(domainId, sousDomaineId) : [];

  const handleSubmit = async () => {
    if (!nom.trim()) {
      toast.error('Le nom de la classe est requis.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: nom.trim(),
        description: description.trim() || undefined,
        domainId: domainId || undefined,
        sousDomaineId: sousDomaineId || undefined,
        levelId: niveauId || undefined,
        matiereId: undefined,
      };

      console.log('📤 Création de classe avec payload:', payload);

      const data = await createClasse(payload);
      
      console.log('📦 Réponse création classe:', data);

      const newClasse = data?.classe || data?.data || data;
      
      if (newClasse?.name || newClasse?.nom) {
        const className = newClasse.name || newClasse.nom;
        const code = newClasse.codeInvitation || data?.codeInvitation;
        toast.success(`Classe "${className}" créée ! Code : ${code}`);
        onCreated(newClasse);
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (err) {
      console.error('❌ Erreur création classe:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Impossible de créer la classe.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: '#0f172a',
          border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>Nouvelle classe</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Nom *</label>
        <input
          value={nom} onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: Terminale C — Maths, groupe du samedi"
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', margin: '14px 0 6px' }}>Description (optionnel)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />

        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '14px 0 6px' }}>
          Niveau (optionnel — indicatif)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select value={domainId} onChange={(e) => { setDomainId(e.target.value); setSousDomaineId(''); setNiveauId(''); }} style={inputStyle}>
            <option value="">Domaine</option>
            {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </select>
          <select value={sousDomaineId} onChange={(e) => { setSousDomaineId(e.target.value); setNiveauId(''); }} disabled={!domainId} style={inputStyle}>
            <option value="">Filière</option>
            {sousDomaines.map((sd) => <option key={sd.id} value={sd.id}>{sd.nom}</option>)}
          </select>
        </div>
        <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} disabled={!sousDomaineId} style={{ ...inputStyle, marginTop: 8, width: '100%' }}>
          <option value="">Niveau</option>
          {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
        </select>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', marginTop: 22, padding: 14,
            background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12, color: 'white', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Création…' : 'Créer la classe'}
        </button>
      </motion.div>
    </motion.div>
  );
};

const inputStyle = {
  width: '100%', padding: 11, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#f8fafc',
  fontSize: '0.85rem', outline: 'none',
};

export default MesClasses;