// src/pages/Formateur/TeacherContentRequests.jsx
// NOUVEAU (audit stratégique 2.3) — l'onglet "Demandes de contenu" du
// tableau de bord formateur : liste les demandes de leçon des apprenants,
// permet de les prendre en charge, de les rejeter, ou de les traiter en
// publiant directement une leçon en réponse (redirige vers SIKOLO avec le
// référentiel pré-rempli).
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Inbox, Clock, CheckCircle, XCircle, ArrowLeft, Star } from 'lucide-react';
import NavHome from '../../components/NavHome';
import { getContentRequests, updateContentRequestStatus } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_META = {
  pending: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  in_progress: { label: 'Prise en charge', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  fulfilled: { label: 'Traitée', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected: { label: 'Rejetée', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const card = {
  background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)',
  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16,
};

const TeacherContentRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getContentRequests({ status: statusFilter !== 'all' ? statusFilter : undefined });
      setRequests(res?.data || []);
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
      toast.error('Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]); // eslint-disable-line

  const handleTakeOver = async (id) => {
    try {
      await updateContentRequestStatus(id, { status: 'in_progress' });
      toast.success('Demande prise en charge');
      fetchRequests();
    } catch {
      toast.error('Erreur lors de la prise en charge');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet (facultatif) :') || '';
    try {
      await updateContentRequestStatus(id, { status: 'rejected', rejectionReason: reason });
      toast.success('Demande rejetée');
      fetchRequests();
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleFulfill = (req) => {
    // Redirige vers SIKOLO — la publication d'une leçon associée à cette
    // demande (fulfillsRequest) la marque automatiquement "traitée" côté
    // serveur (voir routes/lessons.js).
    navigate('/sikolo', { state: { fulfillsRequest: req._id, prefill: req } });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#05071a 0%,#0a0f2e 60%,#05071a 100%)', padding: 24 }}>
      <NavHome />
      <main style={{ maxWidth: 900, margin: '0 auto', paddingTop: 8 }}>
        <button
          onClick={() => navigate('/formateur/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Retour au tableau de bord
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Inbox size={28} color="#818cf8" />
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Demandes de contenu</h1>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          Leçons personnalisées demandées par vos apprenants (SIKOLO).
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['pending', 'in_progress', 'fulfilled', 'rejected', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${statusFilter === s ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                color: statusFilter === s ? '#a5b4fc' : '#94a3b8',
              }}
            >
              {s === 'all' ? 'Toutes' : STATUS_META[s].label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Chargement…</p>
        ) : requests.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <Inbox size={32} color="#475569" style={{ marginBottom: 10 }} />
            <p style={{ color: '#64748b' }}>Aucune demande pour ce filtre</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((r) => {
              const meta = STATUS_META[r.status] || STATUS_META.pending;
              return (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...card, padding: 18 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                          {r.student?.firstName} {r.student?.lastName}
                        </span>
                        {r.priority && (
                          <span title="Compte Établissement — priorité" style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fbbf24', fontSize: '0.7rem' }}>
                            <Star size={11} fill="#fbbf24" /> Prioritaire
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.76rem' }}>
                        {r.matiere || r.matiereId} · {r.niveau || r.niveauId}
                        {r.libChapitre && ` · ${r.libChapitre}`}
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {r.description}
                  </p>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleTakeOver(r._id)} style={btnStyle('#6366f1')}>Prendre en charge</button>
                      <button onClick={() => handleFulfill(r)} style={btnStyle('#10b981')}>
                        <CheckCircle size={13} /> Publier une leçon
                      </button>
                      <button onClick={() => handleReject(r._id)} style={btnStyle('#ef4444', true)}>
                        <XCircle size={13} /> Rejeter
                      </button>
                    </div>
                  )}
                  {r.status === 'in_progress' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleFulfill(r)} style={btnStyle('#10b981')}>
                        <CheckCircle size={13} /> Publier une leçon
                      </button>
                      <button onClick={() => handleReject(r._id)} style={btnStyle('#ef4444', true)}>
                        <XCircle size={13} /> Rejeter
                      </button>
                    </div>
                  )}
                  {r.status === 'fulfilled' && r.fulfilledLessons?.length > 0 && (
                    <div style={{ color: '#64748b', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} /> Répondu par : {r.fulfilledLessons.map((l) => l.title).join(', ')}
                    </div>
                  )}
                  {r.status === 'rejected' && r.rejectionReason && (
                    <div style={{ color: '#f87171', fontSize: '0.76rem' }}>Motif : {r.rejectionReason}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const btnStyle = (color, ghost = false) => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
  background: ghost ? 'rgba(239,68,68,0.1)' : color,
  border: ghost ? `1px solid ${color}` : 'none',
  color: ghost ? color : '#fff',
});

export default TeacherContentRequests;
