// src/components/ImageUploader.jsx — Version enrichie
// Compatible avec les deux APIs :
//   - Nouvelle : <ImageUploader value onChange(url, base64, metadata) label />
//   - Legacy   : <ImageUploader onUpload(file) />
import React, { useState, useRef } from 'react';

const MAX_SIZE_MB = 2;

const ImageUploader = ({ value = '', onChange, onUpload, label = 'Image (optionnel)' }) => {
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Fichier non reconnu comme image');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image trop lourde (max ${MAX_SIZE_MB} Mo)`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPreview(base64);
      // Nouvelle API
      if (typeof onChange === 'function') {
        onChange('', base64, {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storageType: 'base64',
        });
      }
      // API legacy
      if (typeof onUpload === 'function') onUpload(file);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    if (typeof onChange === 'function') {
      onChange('', '', { originalName: '', mimeType: '', size: 0, storageType: 'none' });
    }
  };

  return (
    <div className="image-uploader">
      {label && (
        <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: 8 }}>
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="upload-button"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 80, border: '1px dashed rgba(99,102,241,0.4)',
          borderRadius: 12, cursor: 'pointer', color: '#94a3b8',
          background: 'rgba(255,255,255,0.03)', padding: 12, position: 'relative',
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Aperçu"
              className="preview-image"
              style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8 }}
            />
            <button
              onClick={clearImage}
              title="Retirer l'image"
              style={{
                position: 'absolute', top: 8, right: 8, width: 26, height: 26,
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.9)', color: '#fff', fontWeight: 700,
              }}
            >
              ×
            </button>
          </>
        ) : (
          <span>📷 Cliquer pour ajouter une image (max {MAX_SIZE_MB} Mo)</span>
        )}
      </label>
      {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 6 }}>{error}</p>}
    </div>
  );
};

export default ImageUploader;
