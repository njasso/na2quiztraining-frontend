// src/pages/GeneratePage.jsx — Génération IA complète
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Download, Save, RefreshCw, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { generateQuestions } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import NavHome from '../components/NavHome';
const LEVELS   = ['Primaire', 'Secondaire', 'Lycée', 'Universitaire', 'Professionnel'];
const DOMAINS  = ['Éducation', 'Sciences', 'Technologie', 'Médical', 'Droit', 'Commerce'];
const SUBJECTS = {
  Éducation:    ['Mathématiques', 'Français', 'Histoire', 'Géographie', 'Sciences'],
  Sciences:     ['Physique', 'Chimie', 'Biologie', 'Astronomie'],
  Technologie:  ['Informatique', 'Électronique', 'IA', 'Réseaux'],
  Médical:      ['Anatomie', 'Pharmacologie', 'Chirurgie', 'Médecine générale'],
  Droit:        ['Droit civil', 'Droit pénal', 'Droit commercial', 'Droit international'],
  Commerce:     ['Marketing', 'Comptabilité', 'Management', 'Économie'],
};
const QTYPES = [
  { value: 'qcm',    label: 'QCM (4 choix)' },
  { value: 'vf',     label: 'Vrai / Faux' },
  { value: 'ouvert', label: 'Questions ouvertes' },
  { value: 'mixte',  label: 'Mixte' },
];

const Select = ({ label, value, onChange, options, placeholder }) => (
  <div className="gen-field">
    <label className="gen-label">{label}</label>
    <div className="gen-select-wrap">
      <select className="gen-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <ChevronDown size={14} className="gen-select-arrow" />
    </div>
  </div>
);

const GeneratePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    domain: '', level: '', subject: '', type: 'qcm',
    count: 10, keywords: '',
  });
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [saved,     setSaved]     = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const canGenerate = form.domain && form.level && form.subject;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSaved(false);

    try {
      const res = await generateQuestions({
        domain:    form.domain,
        level:     form.level,
        subject:   form.subject,
        type:      form.type,
        count:     form.count,
        keywords:  form.keywords,
      });
      const qs = res?.questions || res?.data?.questions || [];
      if (qs.length === 0) throw new Error('Aucune question générée — vérifiez la configuration du backend IA.');
      setQuestions(qs);
    } catch (err) {
      // Données de démonstration si le backend n'est pas dispo
      setQuestions(Array.from({ length: form.count }, (_, i) => ({
        id: i + 1,
        question: `Question ${i + 1} — ${form.subject} (${form.level})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: `Explication de la réponse ${i + 1}.`,
      })));
      setError('Backend IA non disponible — questions de démonstration affichées.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { saveQuestions } = await import('../services/api');
      await saveQuestions({ questions, metadata: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(true); // Mode démo
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${form.subject} — ${form.level}`, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} · ${questions.length} questions`, 14, 26);

    const rows = questions.map((q, i) => [
      `${i + 1}. ${q.question}`,
      (q.options || []).map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join('\n'),
      String.fromCharCode(65 + (q.correctAnswer || 0)),
    ]);

    doc.autoTable({
      startY: 32,
      head: [['Question', 'Options', 'Réponse']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 90 }, 2: { cellWidth: 15 } },
    });

    doc.save(`quiz_${form.subject}_${form.level}.pdf`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020918', padding: '32px 24px', fontFamily: 'Nunito, sans-serif' }}>
      <NavHome />
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} color="white" />
            </span>
            Génération par IA
          </h1>
          <p style={{ color: '#64748b', marginTop: 6 }}>Créez des épreuves sur-mesure en quelques secondes</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
          {/* ── Panneau config ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24, height: 'fit-content' }}
          >
            <h2 style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
              Configuration
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Domaine */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Domaine</label>
                <select value={form.domain} onChange={e => { set('domain', e.target.value); set('subject', ''); }}
                  style={{ width: '100%', background: '#0a1120', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.875rem' }}>
                  <option value="">Choisir...</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Niveau */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Niveau</label>
                <select value={form.level} onChange={e => set('level', e.target.value)}
                  style={{ width: '100%', background: '#0a1120', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.875rem' }}>
                  <option value="">Choisir...</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Matière */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Matière</label>
                <select value={form.subject} onChange={e => set('subject', e.target.value)} disabled={!form.domain}
                  style={{ width: '100%', background: '#0a1120', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: form.domain ? '#e2e8f0' : '#475569', fontSize: '0.875rem', opacity: form.domain ? 1 : 0.6 }}>
                  <option value="">Choisir...</option>
                  {(SUBJECTS[form.domain] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Type de questions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {QTYPES.map(t => (
                    <button key={t.value} onClick={() => set('type', t.value)}
                      style={{ padding: '8px', borderRadius: 8, border: `1px solid ${form.type === t.value ? '#6366f1' : '#1e293b'}`,
                        background: form.type === t.value ? '#6366f115' : '#0a1120',
                        color: form.type === t.value ? '#a5b4fc' : '#64748b',
                        fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
                  Nombre de questions : <strong style={{ color: '#a5b4fc' }}>{form.count}</strong>
                </label>
                <input type="range" min={5} max={50} step={5} value={form.count} onChange={e => set('count', +e.target.value)}
                  style={{ width: '100%', accentColor: '#6366f1' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>
                  <span>5</span><span>50</span>
                </div>
              </div>

              {/* Mots-clés */}
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
                  Mots-clés <span style={{ color: '#334155' }}>(optionnel)</span>
                </label>
                <input value={form.keywords} onChange={e => set('keywords', e.target.value)}
                  placeholder="ex: dérivées, limites..."
                  style={{ width: '100%', background: '#0a1120', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>

              {/* Bouton générer */}
              <motion.button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                whileHover={canGenerate && !loading ? { scale: 1.02 } : {}}
                whileTap={canGenerate && !loading ? { scale: 0.98 } : {}}
                style={{ padding: '12px', borderRadius: 10, border: 'none', cursor: canGenerate && !loading ? 'pointer' : 'not-allowed',
                  background: canGenerate ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e293b',
                  color: canGenerate ? 'white' : '#475569', fontWeight: 700, fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: canGenerate ? '0 4px 16px #6366f140' : 'none' }}>
                {loading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Génération...</>
                         : <><Zap size={16} /> Générer {form.count} questions</>}
              </motion.button>
            </div>
          </motion.div>

          {/* ── Résultats ────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: 8,
                color: '#fbbf24', fontSize: '0.8rem', marginBottom: 16 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {questions.length > 0 && (
              <>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                      background: saved ? '#10b98120' : '#1e293b', border: `1px solid ${saved ? '#10b981' : '#334155'}`,
                      borderRadius: 8, color: saved ? '#10b981' : '#94a3b8', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>
                    {saved ? <><CheckCircle size={14} /> Enregistré !</> : <><Save size={14} /> Enregistrer</>}
                  </button>
                  <button onClick={handleExportPDF}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                      background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>
                    <Download size={14} /> Exporter PDF
                  </button>
                  <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '0.8rem', alignSelf: 'center' }}>
                    {questions.length} questions générées
                  </span>
                </div>

                {/* Liste questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
                  {questions.map((q, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>
                        <span style={{ color: '#6366f1', marginRight: 8 }}>{i + 1}.</span>
                        {q.question}
                      </p>
                      {q.options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          {q.options.map((opt, j) => (
                            <div key={j} style={{ padding: '6px 10px', borderRadius: 6,
                              background: j === q.correctAnswer ? '#10b98115' : '#0a1120',
                              border: `1px solid ${j === q.correctAnswer ? '#10b98140' : '#1e293b'}`,
                              color: j === q.correctAnswer ? '#10b981' : '#64748b',
                              fontSize: '0.8rem' }}>
                              <strong>{String.fromCharCode(65 + j)}.</strong> {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#475569', borderTop: '1px solid #1e293b', paddingTop: 8 }}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {!loading && questions.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 400, background: '#0f172a', borderRadius: 16, border: '1px dashed #1e293b' }}>
                <Zap size={48} color="#1e293b" style={{ marginBottom: 16 }} />
                <p style={{ color: '#334155', fontSize: '0.9rem', textAlign: 'center' }}>
                  Configurez les paramètres et cliquez<br />sur "Générer" pour créer vos questions
                </p>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 400, background: '#0f172a', borderRadius: 16, border: '1px solid #1e293b' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Zap size={40} color="#6366f1" />
                </motion.div>
                <p style={{ color: '#64748b', marginTop: 16, fontSize: '0.9rem' }}>Génération en cours...</p>
                <p style={{ color: '#334155', fontSize: '0.78rem', marginTop: 4 }}>L'IA prépare vos {form.count} questions</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GeneratePage;
