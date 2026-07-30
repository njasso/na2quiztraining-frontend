// src/pages/SubscriptionPage.jsx - VERSION CORRIGÉE
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown, Zap, Award, CheckCircle, X, Shield, Rocket,
  ArrowLeft, Sparkles, CreditCard, Smartphone, Lock,
  Users, BookOpen, BarChart3, Download, Globe, Clock,
  Infinity, Star, TrendingUp, MessageCircle, Trophy,
  RefreshCw  // ✅ IMPORT CORRIGÉ
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import NavHome from '../components/NavHome';
// ============================================
// FORFAITS DISPONIBLES
// ============================================
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: Zap,
    price: '0',
    period: 'à vie',
    color: '#64748b',
    popular: false,
    features: [
      { text: '5 quiz par jour', included: true },
      { text: 'Statistiques de base', included: true },
      { text: 'Accès aux quiz publics', included: true },
      { text: 'Génération IA limitée (3/jour)', included: true },
      { text: 'Sans publicité', included: false },
      { text: 'Certificats personnalisés', included: false },
      { text: 'Mode hors ligne', included: false },
      { text: 'Quiz illimités', included: false },
      { text: 'Support prioritaire', included: false },
      { text: 'Analyses avancées', included: false },
    ],
    buttonText: 'Commencer gratuitement',
    cta: '/register'
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: '2 500',
    period: 'mois',
    color: '#6366f1',
    popular: true,
    features: [
      { text: 'Quiz illimités', included: true },
      { text: 'Statistiques avancées', included: true },
      { text: 'Génération IA illimitée', included: true },
      { text: 'Sans publicité', included: true },
      { text: 'Certificats personnalisés', included: true },
      { text: 'Mode hors ligne', included: true },
      { text: 'Accès prioritaire', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Export des résultats (PDF/Excel)', included: true },
      { text: 'Badges exclusifs', included: true },
    ],
    buttonText: 'Choisir Premium',
    cta: 'premium'
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Rocket,
    price: '5 000',
    period: 'mois',
    color: '#10b981',
    popular: false,
    features: [
      { text: 'Tout ce qui est dans Premium', included: true },
      { text: 'Création de groupes d\'étude', included: true },
      { text: 'Quiz collaboratifs', included: true },
      { text: 'Statistiques d\'équipe', included: true },
      { text: 'API Access', included: true },
      { text: 'Export données brutes', included: true },
      { text: 'Formation personnalisée', included: true },
      { text: 'Gestion multi-utilisateurs', included: true },
      { text: 'Rapports détaillés', included: true },
      { text: 'Support téléphonique 24/7', included: true },
    ],
    buttonText: 'Choisir Pro',
    cta: 'pro'
  }
];

const PAYMENT_METHODS = [
  { id: 'orange', name: 'Orange Money', color: '#f59e0b', icon: '🟠' },
  { id: 'mtn', name: 'MTN Mobile Money', color: '#fbbf24', icon: '🟡' }
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [selectedPayment, setSelectedPayment] = useState('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const campayInitialized = useRef(false);

  // Initialiser Campay
  useEffect(() => {
    if (!campayInitialized.current && typeof window !== 'undefined') {
      // Charger le SDK Campay
      const script = document.createElement('script');
      // ✅ App ID et environnement lus depuis les variables Netlify
      //    (ne jamais coder une clé en dur dans le dépôt)
      const campayAppId = import.meta.env.VITE_CAMPAY_APP_ID || '';
      const campayHost = (import.meta.env.VITE_CAMPAY_ENV === 'production')
        ? 'https://www.campay.net' : 'https://demo.campay.net';
      if (!campayAppId) {
        console.warn('⚠️ VITE_CAMPAY_APP_ID absent : le widget de paiement est désactivé');
        return;
      }
      script.src = `${campayHost}/sdk/js?app-id=${campayAppId}`;
      script.async = true;
      script.onload = () => {
        campayInitialized.current = true;
        console.log('✅ Campay SDK chargé');
      };
      document.body.appendChild(script);
    }
  }, []);

  // Gérer le paiement
  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour souscrire');
      navigate('/login');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    const plan = PLANS.find(p => p.id === selectedPlan);
    if (!plan || plan.id === 'free') {
      navigate('/register');
      return;
    }

    setIsLoading(true);

    try {
      // Appel au backend pour créer la transaction
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          phoneNumber: phoneNumber,
          paymentMethod: selectedPayment,
          amount: parseInt(plan.price.replace(/\s/g, ''))
        })
      });

      const data = await response.json();

      if (data.success) {
        // Ouvrir le modal Campay
        if (window.campay) {
          window.campay.options({
            payButtonId: 'campay-pay-button',
            description: `Abonnement ${plan.name} - NA2 Quiz`,
            amount: data.amount,
            currency: 'XAF',
            externalReference: data.reference,
            redirectUrl: `${window.location.origin}/payment/success`
          });

          window.campay.onSuccess = async (result) => {
            console.log('✅ Paiement réussi:', result);
            await verifyPayment(result.reference);
            toast.success('Paiement réussi ! Votre compte a été mis à jour.');
            navigate('/dashboard');
          };

          window.campay.onFail = (result) => {
            console.log('❌ Paiement échoué:', result);
            toast.error('Le paiement a échoué. Veuillez réessayer.');
            setIsLoading(false);
          };

          window.campay.onModalClose = () => {
            console.log('Modal fermé');
            setIsLoading(false);
          };

          // Déclencher le paiement
          document.getElementById('campay-pay-button')?.click();
        }
      } else {
        toast.error(data.message || 'Erreur lors de la création du paiement');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      toast.error('Erreur de connexion. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  // Vérifier le paiement
  const verifyPayment = async (reference) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reference })
      });
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  // Gérer la redirection depuis la page d'accueil
  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      <NavHome />
      {/* Background Grid */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              padding: 12,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              marginBottom: 8,
            }}>
              <Crown size={14} color="#f59e0b" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                ABONNEMENTS
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Choisissez votre forfait
            </h1>
            <p style={{ color: '#94a3b8' }}>
              Débloquez toutes les fonctionnalités et boostez votre apprentissage
            </p>
          </div>
        </div>

        {/* Bascule mensuel/annuel */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 40,
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 40,
            padding: 4,
          }}>
            <button style={{
              padding: '10px 24px',
              borderRadius: 32,
              background: '#6366f1',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Mensuel
            </button>
            <button style={{
              padding: '10px 24px',
              borderRadius: 32,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              Annuel
              <span style={{
                background: '#10b98120',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: '0.7rem',
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Grille des forfaits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 48,
        }}>
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(15,23,42,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: `2px solid ${isSelected ? plan.color : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 24,
                  padding: 32,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: '#f59e0b',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Sparkles size={12} /> Populaire
                  </div>
                )}

                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${plan.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={28} color={plan.color} />
                </div>

                <h3 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 800 }}>
                    {plan.price} FCFA
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/{plan.period}</span>
                </div>

                <button
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    background: isSelected ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` : 'rgba(255,255,255,0.05)',
                    border: isSelected ? 'none' : '1px solid rgba(99,102,241,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 24,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (plan.id === 'free') {
                      handleStartClick();
                    } else {
                      setShowPaymentModal(true);
                    }
                  }}
                >
                  {plan.buttonText}
                </button>

                <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: 20 }}>
                  {plan.features.map((feature, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      color: feature.included ? '#94a3b8' : '#475569',
                    }}>
                      {feature.included ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <X size={16} color="#475569" />
                      )}
                      <span style={{ fontSize: '0.85rem' }}>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Comparaison des fonctionnalités */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 24,
            padding: 32,
            marginBottom: 48,
          }}
        >
          <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
            Comparaison détaillée
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8' }}>Fonctionnalité</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>Gratuit</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#6366f1' }}>Premium</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#10b981' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Quiz par jour', '5', 'Illimité', 'Illimité'],
                  ['Génération IA', '3/jour', 'Illimitée', 'Illimitée'],
                  ['Statistiques', 'Basiques', 'Avancées', 'Expert'],
                  ['Certificats', '❌', '✅', '✅'],
                  ['Mode hors ligne', '❌', '✅', '✅'],
                  ['Export données', '❌', 'PDF/Excel', 'Tous formats'],
                  ['Support', 'Email', 'Prioritaire', '24/7 Téléphone'],
                  ['API Access', '❌', '❌', '✅'],
                  ['Gestion équipe', '❌', '❌', '✅'],
                  ['Formation', '❌', '❌', 'Personnalisée'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <td style={{ padding: '12px 16px', color: '#f8fafc' }}>{row[0]}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>{row[1]}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#a5b4fc' }}>{row[2]}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6ee7b7' }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Garanties */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 48,
        }}>
          {[
            { icon: Shield, title: 'Paiement sécurisé', desc: 'Transactions cryptées', color: '#10b981' },
            { icon: RefreshCw, title: 'Annulation facile', desc: 'Sans engagement', color: '#6366f1' },
            { icon: Lock, title: 'Données protégées', desc: 'Confidentialité garantie', color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <item.icon size={24} color={item.color} />
              </div>
              <h3 style={{ color: '#f8fafc', marginBottom: 4 }}>{item.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de paiement */}
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPaymentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 24,
              padding: 32,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ color: '#f8fafc', fontSize: '1.3rem' }}>Paiement Mobile Money</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Plan sélectionné */}
            <div style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Forfait sélectionné</p>
              <p style={{ color: '#f8fafc', fontWeight: 600 }}>
                {PLANS.find(p => p.id === selectedPlan)?.name} - {PLANS.find(p => p.id === selectedPlan)?.price} FCFA/mois
              </p>
            </div>

            {/* Méthodes de paiement */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 12 }}>Choisissez votre opérateur</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: 12,
                      background: selectedPayment === method.id ? `${method.color}20` : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${selectedPayment === method.id ? method.color : 'rgba(99,102,241,0.2)'}`,
                      color: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 8 }}>Numéro de téléphone</p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                padding: '0 16px',
              }}>
                <span style={{ color: '#94a3b8', marginRight: 8 }}>+237</span>
                <input
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '16px 0',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    outline: 'none',
                    fontSize: '1rem',
                  }}
                />
                <Smartphone size={18} color="#64748b" />
              </div>
            </div>

            {/* Bouton de paiement */}
            <button
              onClick={handlePayment}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Payer {PLANS.find(p => p.id === selectedPlan)?.price} FCFA
                </>
              )}
            </button>

            <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: 16 }}>
              Paiement sécurisé via Campay. Vous serez redirigé vers votre application Mobile Money.
            </p>

            {/* Bouton caché pour Campay */}
            <button id="campay-pay-button" style={{ display: 'none' }}></button>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;