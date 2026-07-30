// Version simplifiée de CreateExamPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavHome from '../components/NavHome';
import {
  Bot, PenTool, Database, FileText,
  ArrowLeft, ChevronRight, Sparkles, Target,
} from 'lucide-react';

const CreateExamPage = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'ai',
      title: 'Génération par IA',
      description: 'L\'IA crée un quiz personnalisé selon votre domaine, niveau et matière',
      icon: Bot,
      color: '#6366f1',
      features: ['Questions uniques', 'Adapté au niveau', 'Rapide'],
      action: () => navigate('/generate-quiz'),
    },
    {
      id: 'manual',
      title: 'Création manuelle',
      description: 'Rédigez chaque question vous-même, avec un contrôle total sur le contenu',
      icon: PenTool,
      color: '#10b981',
      features: ['Contrôle total', 'Personnalisation', 'Export PDF'],
      action: () => navigate('/manual'),
    },
    {
      id: 'db',
      title: 'Base de questions',
      description: 'Sélectionnez des questions depuis le catalogue existant en base de données',
      icon: Database,
      color: '#f59e0b',
      features: ['Questions validées', 'Multi-domaines', 'Rapide'],
      action: () => navigate('/database'),
    },
    {
      id: 'file',
      title: 'Depuis un document',
      description: 'Importez un fichier Word ou PDF pour en extraire et transformer le contenu',
      icon: FileText,
      color: '#8b5cf6',
      features: ['Word / PDF', 'Extraction auto', 'IA assistée'],
      action: () => navigate('/compose/file'),
    },
  ];

  return (
    <div style={containerStyle}>
      <NavHome />
      <div style={gridBgStyle} />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
        {/* Header - same as before */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} style={btnSecStyle}>
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 12px', background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, marginBottom: 8 }}>
              <Sparkles size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>MÉTHODE DE CRÉATION</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Comment créer votre quiz ?
            </h1>
          </div>
        </div>

        {/* Grid of options */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.div key={opt.id} initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                onClick={opt.action}
                style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(12px)',
                  border: `1px solid ${opt.color}25`, borderRadius: 22, padding: 28,
                  cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {/* ... rest of the card content same as before ... */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: opt.color, borderRadius: '22px 22px 0 0' }} />
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${opt.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={28} color={opt.color} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>
                  {opt.title}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
                  {opt.description}
                </p>
                <div style={{ marginBottom: 20 }}>
                  {opt.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: opt.color }} />
                      <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: opt.color, fontSize: '0.9rem', fontWeight: 600 }}>Choisir</span>
                  <ChevronRight size={18} color={opt.color} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Help section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 32, padding: '18px 22px', background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={22} color="#6366f1" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
              Vous ne savez pas quoi choisir ?
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Commencez par la génération IA — c'est la méthode la plus rapide. La création manuelle offre
              le plus de contrôle. La base de données est idéale pour les formateurs.
            </p>
          </div>
          <button onClick={() => navigate('/generate-quiz')}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', borderRadius: 10, color: 'white', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Essayer l'IA
          </button>
        </motion.div>
      </main>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)', padding: '24px' };
const gridBgStyle = { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' };
const btnSecStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 12, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default CreateExamPage;