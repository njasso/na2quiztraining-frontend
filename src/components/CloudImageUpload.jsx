// src/components/CloudImageUpload.jsx — Upload d'image vers Cloudinary
// Remplace l'envoi en base64 : l'image part sur Cloudinary et seule l'URL
// est stockée en base (bien plus léger et rapide à l'affichage).
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader, Image as ImageIcon, AlertCircle } from 'lucide-react';
import http from '../services/http';

const MAX_MB = 5;

/**
 * @param {string}   value      URL actuelle de l'image
 * @param {function} onChange   (url, publicId, meta) => void
 * @param {string}   folder     questions | avatars | exams
 * @param {string}   label
 */
const CloudImageUpload = ({ value = '', onChange, folder = 'questions', label = 'Image (optionnel)' }) => {
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [publicId, setPublicId] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setPreview(value || ''); }, [value]);

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Le fichier doit être une image');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Image trop lourde (max ${MAX_MB} Mo)`);

    // Aperçu local immédiat
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setProgress(0);

    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await http.post(`/upload?folder=${encodeURIComponent(folder)}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (data?.success && data.url) {
        setPreview(data.url);
        setPublicId(data.publicId || '');
        onChange?.(data.url, data.publicId || '', {
          originalName: file.name, mimeType: file.type, size: file.size,
          storageType: data.provider || 'cloudinary',
          width: data.width, height: data.height,
        });
      } else {
        throw new Error(data?.error || "L'upload a échoué");
      }
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 413 ? `Image trop lourde (max ${MAX_MB} Mo)`
        : status === 401 ? 'Session expirée — reconnectez-vous'
        : err.response?.data?.error || err.message || "Erreur lors de l'envoi"
      );
      setPreview(value || '');
    } finally {
      setUploading(false);
      setProgress(0);
      URL.revokeObjectURL(localUrl);
    }
  };

  const clear = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (publicId) {
      try { await http.delete(`/upload/${encodeURIComponent(publicId)}`); } catch { /* non bloquant */ }
    }
    setPreview(''); setPublicId(''); setError('');
    if (inputRef.current) inputRef.current.value = '';
    onChange?.('', '', { storageType: 'none' });
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer?.files?.[0]);
  };

  return (
    <div>
      {label && <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: 8 }}>{label}</label>}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])} />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          position: 'relative', minHeight: 130, cursor: uploading ? 'wait' : 'pointer',
          border: `1.5px dashed ${error ? 'rgba(239,68,68,0.6)' : 'rgba(99,102,241,0.45)'}`,
          borderRadius: 14, background: 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: 12,
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Aperçu" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, display: 'block' }} />
            {!uploading && (
              <button type="button" onClick={clear} title="Retirer l'image"
                style={{
                  position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                  border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.92)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <X size={15} />
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <ImageIcon size={26} style={{ marginBottom: 6, opacity: 0.7 }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe' }}>
              Cliquez ou déposez une image
            </div>
            <div style={{ fontSize: '0.72rem', marginTop: 4 }}>JPEG, PNG, WebP · max {MAX_MB} Mo</div>
          </div>
        )}

        {uploading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Loader size={22} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#c7d2fe', fontSize: '0.8rem' }}>Envoi… {progress}%</div>
            <div style={{ width: '62%', height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', borderRadius: 3, transition: 'width .2s' }} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertCircle size={13} /> {error}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default CloudImageUpload;
