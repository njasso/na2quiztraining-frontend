// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary a attrapé une erreur:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: 16
            }}>
              ⚠️
            </div>
            <h2 style={{ 
              color: '#ef4444', 
              marginBottom: 16,
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              Une erreur est survenue
            </h2>
            <p style={{ 
              color: '#94a3b8', 
              marginBottom: 24,
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}>
              {this.state.error?.message || 'Erreur inattendue dans l\'application'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div style={{
                background: '#1e293b',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                textAlign: 'left',
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <pre style={{
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Rafraîchir la page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 8,
                  color: '#a5b4fc',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; // ✅ Export par défaut