// src/pages/CoursPlatform.jsx — SIKOLO
// ═══════════════════════════════════════════════════════════════
// RÉÉCRITURE COMPLÈTE (audit stratégique 2.3)
// L'ancienne version stockait les PDF dans IndexedDB — c'est-à-dire
// uniquement dans le navigateur de la personne qui les uploadait, sans
// jamais quitter l'appareil. Un formateur ne pouvait donc jamais
// réellement partager une leçon avec ses apprenants : chacun aurait dû
// re-uploader le même fichier séparément. Cette version utilise le vrai
// backend (routes/lessons.js) avec les PDF hébergés sur Cloudinary.
//
// Fonctionnalités :
//   - Catalogue de leçons filtrable par référentiel académique
//   - Lecture en ligne toujours disponible ; téléchargement réservé aux
//     abonnements Basique et supérieur (voir SubscriptionStatusCard)
//   - Demande de leçon personnalisée réservée au Premium+ — transmise au
//     tableau de bord formateur (voir TeacherContentRequests.jsx)
//   - Publication de leçons par les formateurs/admins, avec upload PDF
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch, FiUpload, FiDownload, FiBook, FiBookOpen, FiX, FiSend,
} from 'react-icons/fi';
import { Lock, Loader, Sparkles } from 'lucide-react';
import NavHome from '../components/NavHome';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllDomaines, getAllSousDomaines, getAllLevels, getAllMatieres,
} from '../data/domainConfig';
import {
  getLessons, viewLesson, downloadLesson, publishLesson, createContentRequest,
} from '../services/api';
import toast from 'react-hot-toast';

const canTeach = (user) => ['formateur', 'admin', 'superadmin'].includes(user?.role);
const PLAN_RANK = { free: 0, basic: 1, premium: 2, etablissement: 3, pro: 2, enterprise: 3 };
const planRank = (p) => PLAN_RANK[p] ?? 0;
const hasActiveSub = (user) => Boolean(user?.subscription?.active && user?.subscription?.endDate && new Date(user.subscription.endDate) > new Date());
const canDownloadLocal = (user) => canTeach(user) || (hasActiveSub(user) && planRank(user.subscription.plan) >= 1);
const canRequestLocal = (user) => hasActiveSub(user) && planRank(user.subscription.plan) >= 2;

const card = {
  background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)',
  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16,
};
const inputStyle = {
  width: '100%', padding: 10, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#f8fafc', outline: 'none',
};

const CoursPlatform = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [lessons, setLessons] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [loadingViewer, setLoadingViewer] = useState(false);

  const [fDomaine, setFDomaine] = useState('');
  const [fSousDomaine, setFSousDomaine] = useState('');
  const [fNiveau, setFNiveau] = useState('');
  const [fMatiere, setFMatiere] = useState('');

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  // NOUVEAU : arrivee depuis "Demandes de contenu" (formateur) — la demande
  // a traiter est transmise via l'etat de navigation (voir
  // TeacherContentRequests.jsx handleFulfill). On ouvre directement la
  // modale de publication, pre-remplie avec le referentiel de la demande.
  const location = useLocation();
  const [fulfillsRequest, setFulfillsRequest] = useState(location.state?.fulfillsRequest || null);
  const [prefill, setPrefill] = useState(location.state?.prefill || null);

  const domaines = useMemo(() => getAllDomaines(), []);
  const sousDomaines = fDomaine ? getAllSousDomaines(fDomaine) : [];
  const niveaux = fDomaine && fSousDomaine ? getAllLevels(fDomaine, fSousDomaine) : [];
  const matieres = fDomaine && fSousDomaine ? getAllMatieres(fDomaine, fSousDomaine) : [];

  const fetchLessons = async () => {
    setLoadingList(true);
    try {
      const res = await getLessons({
        domaineId: fDomaine || undefined, sousDomaineId: fSousDomaine || undefined,
        niveauId: fNiveau || undefined, matiereId: fMatiere || undefined,
        search: searchTerm || undefined,
      });
      setLessons(res?.data || []);
    } catch (err) {
      console.error('Erreur chargement leçons:', err);
      toast.error('Impossible de charger les leçons');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchLessons(); }, [fDomaine, fSousDomaine, fNiveau, fMatiere]); // eslint-disable-line

  useEffect(() => {
    if (fulfillsRequest) setShowPublishModal(true);
  }, [fulfillsRequest]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLessons();
  };

  const openLesson = async (lesson) => {
    setSelected(lesson);
    setLoadingViewer(true);
    try {
      const res = await viewLesson(lesson._id);
      setViewerUrl(res.url);
    } catch (err) {
      toast.error("Impossible d'ouvrir cette leçon");
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleDownload = async (lesson) => {
    if (!canDownloadLocal(user)) {
      toast.error('Le téléchargement nécessite un abonnement Basique ou supérieur');
      navigate('/subscription');
      return;
    }
    try {
      const res = await downloadLesson(lesson._id);
      const a = document.createElement('a');
      a.href = res.url; a.download = res.filename || `${lesson.title}.pdf`; a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error('Le téléchargement nécessite un abonnement Basique ou supérieur');
        navigate('/subscription');
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    }
  };

  const filtered = lessons.filter((l) =>
    !searchTerm || l.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#05071a 0%,#0a0f2e 60%,#05071a 100%)', padding: 24, display: 'flex', flexDirection: 'column' }}>
      <NavHome />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <FiBookOpen size={28} color="#818cf8" />
        <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>SIKOLO</h1>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Formations et leçons</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Colonne latérale : recherche, filtres, liste */}
        <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <input
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une leçon..." style={inputStyle}
            />
            <button type="submit" style={{ padding: '0 12px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}>
              <FiSearch size={16} />
            </button>
          </form>

          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            <select value={fDomaine} onChange={(e) => { setFDomaine(e.target.value); setFSousDomaine(''); setFNiveau(''); setFMatiere(''); }} style={inputStyle}>
              <option value="">Tous domaines</option>
              {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            {fDomaine && (
              <select value={fSousDomaine} onChange={(e) => { setFSousDomaine(e.target.value); setFNiveau(''); setFMatiere(''); }} style={inputStyle}>
                <option value="">Toute filière</option>
                {sousDomaines.map((sd) => <option key={sd.id} value={sd.id}>{sd.nom}</option>)}
              </select>
            )}
            {fSousDomaine && (
              <>
                <select value={fNiveau} onChange={(e) => setFNiveau(e.target.value)} style={inputStyle}>
                  <option value="">Tout niveau</option>
                  {niveaux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </select>
                <select value={fMatiere} onChange={(e) => setFMatiere(e.target.value)} style={inputStyle}>
                  <option value="">Toute matière</option>
                  {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </>
            )}
          </div>

          {canTeach(user) ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowPublishModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: 12, borderRadius: 12, border: 'none', marginBottom: 14,
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <FiUpload size={16} /> Publier une formation
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => canRequestLocal(user) ? setShowRequestModal(true) : (toast.error('Réservé aux abonnements Premium et supérieur'), navigate('/subscription'))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: 12, borderRadius: 12, marginBottom: 14, fontWeight: 600, cursor: 'pointer',
                background: canRequestLocal(user) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                border: canRequestLocal(user) ? 'none' : '1px solid rgba(148,163,184,0.3)',
                color: canRequestLocal(user) ? '#fff' : '#94a3b8',
              }}
            >
              {canRequestLocal(user) ? <FiSend size={16} /> : <Lock size={14} />}
              Demander une leçon
            </motion.button>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                <Loader size={22} className="animate-spin" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: '0.8rem' }}>Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                <FiBook size={26} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: '0.82rem' }}>Aucune leçon pour cette sélection</p>
              </div>
            ) : (
              filtered.map((l) => (
                <button
                  key={l._id}
                  onClick={() => openLesson(l)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: 12, marginBottom: 8,
                    borderRadius: 10, cursor: 'pointer',
                    background: selected?._id === l._id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selected?._id === l._id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>{l.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    {l.matiere || l.matiereId} · {l.teacher?.firstName} {l.teacher?.lastName}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panneau principal : visionneuse */}
        <div style={{ ...card, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <FiBookOpen size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p>Sélectionnez une leçon pour la consulter</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>{selected.title}</div>
                  {selected.description && <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>{selected.description}</div>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(selected)}
                  title={canDownloadLocal(user) ? 'Télécharger' : 'Nécessite un abonnement Basique+'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                    border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    background: canDownloadLocal(user) ? '#10b981' : 'rgba(255,255,255,0.08)',
                    color: canDownloadLocal(user) ? '#fff' : '#64748b',
                  }}
                >
                  {canDownloadLocal(user) ? <FiDownload size={14} /> : <Lock size={13} />}
                  Télécharger
                </motion.button>
              </div>
              <div style={{ flex: 1, background: '#0b1226' }}>
                {loadingViewer ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader size={24} color="#818cf8" className="animate-spin" />
                  </div>
                ) : (
                  <iframe title={selected.title} src={viewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRequestModal && (
          <RequestLessonModal onClose={() => setShowRequestModal(false)} onSent={() => { setShowRequestModal(false); toast.success('Demande envoyée à un formateur'); }} />
        )}
        {showPublishModal && (
          <PublishLessonModal
            fulfillsRequest={fulfillsRequest}
            prefill={prefill}
            onClose={() => { setShowPublishModal(false); setFulfillsRequest(null); setPrefill(null); }}
            onPublished={() => {
              setShowPublishModal(false); setFulfillsRequest(null); setPrefill(null);
              fetchLessons();
              toast.success(fulfillsRequest ? 'Leçon publiée — la demande est marquée traitée' : 'Formation publiée');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Modale : demande de leçon personnalisée (apprenant, premium+)
// ═══════════════════════════════════════════════════════════════
const RequestLessonModal = ({ onClose, onSent }) => {
  const [domaineId, setDomaineId] = useState('');
  const [sousDomaineId, setSousDomaineId] = useState('');
  const [niveauId, setNiveauId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [libChapitre, setLibChapitre] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const domaines = useMemo(() => getAllDomaines(), []);
  const sousDomaines = domaineId ? getAllSousDomaines(domaineId) : [];
  const niveaux = domaineId && sousDomaineId ? getAllLevels(domaineId, sousDomaineId) : [];
  const matieres = domaineId && sousDomaineId ? getAllMatieres(domaineId, sousDomaineId) : [];

  const submit = async () => {
    if (!domaineId || !niveauId || !matiereId || !description.trim()) {
      toast.error('Référentiel et description requis'); return;
    }
    setSending(true);
    try {
      await createContentRequest({
        domaineId, sousDomaineId, niveauId, matiereId, libChapitre,
        description: description.trim(),
      });
      onSent();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Erreur lors de l'envoi de la demande");
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Demander une leçon personnalisée" icon={<Sparkles size={20} color="#818cf8" />}>
      <div style={{ display: 'grid', gap: 10 }}>
        <select value={domaineId} onChange={(e) => { setDomaineId(e.target.value); setSousDomaineId(''); setNiveauId(''); setMatiereId(''); }} style={inputStyle}>
          <option value="">Domaine...</option>
          {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
        <select value={sousDomaineId} onChange={(e) => { setSousDomaineId(e.target.value); setNiveauId(''); setMatiereId(''); }} disabled={!domaineId} style={inputStyle}>
          <option value="">Filière...</option>
          {sousDomaines.map((sd) => <option key={sd.id} value={sd.id}>{sd.nom}</option>)}
        </select>
        <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} disabled={!sousDomaineId} style={inputStyle}>
          <option value="">Niveau...</option>
          {niveaux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>
        <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} disabled={!sousDomaineId} style={inputStyle}>
          <option value="">Matière...</option>
          {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        <input value={libChapitre} onChange={(e) => setLibChapitre(e.target.value)} placeholder="Chapitre (facultatif)" style={inputStyle} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Décrivez ce que vous souhaitez apprendre..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <ModalActions onClose={onClose} onConfirm={submit} confirmLabel="Envoyer la demande" loading={sending} />
    </ModalShell>
  );
};

// ═══════════════════════════════════════════════════════════════
// Modale : publication d'une leçon (formateur/admin)
// ═══════════════════════════════════════════════════════════════
const PublishLessonModal = ({ onClose, onPublished, fulfillsRequest = null, prefill = null }) => {
  const [title, setTitle] = useState(prefill ? `Réponse — ${prefill.matiere || prefill.matiereId}` : '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [domaineId, setDomaineId] = useState(prefill?.domaineId || '');
  const [sousDomaineId, setSousDomaineId] = useState(prefill?.sousDomaineId || '');
  const [niveauId, setNiveauId] = useState(prefill?.niveauId || '');
  const [matiereId, setMatiereId] = useState(prefill?.matiereId || '');
  const [libChapitre, setLibChapitre] = useState(prefill?.libChapitre || '');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const domaines = useMemo(() => getAllDomaines(), []);
  const sousDomaines = domaineId ? getAllSousDomaines(domaineId) : [];
  const niveaux = domaineId && sousDomaineId ? getAllLevels(domaineId, sousDomaineId) : [];
  const matieres = domaineId && sousDomaineId ? getAllMatieres(domaineId, sousDomaineId) : [];

  const submit = async () => {
    if (!title.trim() || !domaineId || !niveauId || !matiereId || !file) {
      toast.error('Titre, référentiel et fichier PDF requis'); return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('description', description);
      fd.append('domaineId', domaineId);
      fd.append('sousDomaineId', sousDomaineId);
      fd.append('niveauId', niveauId);
      fd.append('matiereId', matiereId);
      fd.append('libChapitre', libChapitre);
      if (fulfillsRequest) fd.append('fulfillsRequest', fulfillsRequest);
      await publishLesson(fd);
      onPublished();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={fulfillsRequest ? "Répondre à une demande" : "Publier une formation"} icon={<FiUpload size={18} color="#10b981" />}>
      {fulfillsRequest && (
        <div style={{ padding: 10, marginBottom: 12, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.78rem' }}>
          Cette leçon répondra automatiquement à la demande de l'apprenant.
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la formation" style={inputStyle} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (facultatif)" style={{ ...inputStyle, resize: 'vertical' }} />
        <select value={domaineId} onChange={(e) => { setDomaineId(e.target.value); setSousDomaineId(''); setNiveauId(''); setMatiereId(''); }} style={inputStyle}>
          <option value="">Domaine...</option>
          {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
        <select value={sousDomaineId} onChange={(e) => { setSousDomaineId(e.target.value); setNiveauId(''); setMatiereId(''); }} disabled={!domaineId} style={inputStyle}>
          <option value="">Filière...</option>
          {sousDomaines.map((sd) => <option key={sd.id} value={sd.id}>{sd.nom}</option>)}
        </select>
        <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} disabled={!sousDomaineId} style={inputStyle}>
          <option value="">Niveau...</option>
          {niveaux.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>
        <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} disabled={!sousDomaineId} style={inputStyle}>
          <option value="">Matière...</option>
          {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        <input value={libChapitre} onChange={(e) => setLibChapitre(e.target.value)} placeholder="Chapitre (facultatif)" style={inputStyle} />
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ color: '#94a3b8', fontSize: '0.82rem' }} />
      </div>
      <ModalActions onClose={onClose} onConfirm={submit} confirmLabel="Publier" loading={sending} />
    </ModalShell>
  );
};

const ModalShell = ({ onClose, title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
      style={{ ...card, padding: 24, width: 440, maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>{title}</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><FiX size={18} /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

const ModalActions = ({ onClose, onConfirm, confirmLabel, loading }) => (
  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
    <button onClick={onClose} style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer' }}>Annuler</button>
    <button onClick={onConfirm} disabled={loading} style={{ padding: '9px 18px', background: '#6366f1', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? '...' : confirmLabel}
    </button>
  </div>
);

export default CoursPlatform;
