// src/pages/CoursPlatform.jsx — Version harmonisée avec le thème NA2 Quiz
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavHome from '../components/NavHome';
import { 
  FiHome, FiSearch, FiUpload, FiDownload, FiPrinter,
  FiBook, FiBookOpen, FiFolder, FiArrowLeft, FiX
} from "react-icons/fi";

// Nom de la base de données IndexedDB et du magasin d'objets
const DB_NAME = 'sikoloCoursDB';
const STORE_NAME = 'uploadedCourses';
const DB_VERSION = 1;

// Fonction pour ouvrir la base de données IndexedDB
const openDb = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
};

// Fonction pour récupérer tous les cours depuis IndexedDB
const getUploadedCoursesFromDb = async () => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      console.error("Error getting courses from IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
};

// Fonction pour ajouter un cours à IndexedDB
const addCourseToDb = async (course) => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.add(course);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error adding course to IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
};

// Fonction pour effacer tous les cours d'IndexedDB
const clearAllUploadedCoursesFromDb = async () => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error("Error clearing IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });
};

const CoursPlatform = () => {
  const navigate = useNavigate();
  const [selectedCours, setSelectedCours] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [uploadedCours, setUploadedCours] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [listError, setListError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const fileInputRef = useRef(null);

  // Effet pour charger les cours téléchargés depuis IndexedDB
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const savedUploadedCours = await getUploadedCoursesFromDb();
        setUploadedCours(savedUploadedCours);
      } catch (error) {
        console.error("Erreur lors du chargement des cours depuis IndexedDB:", error);
        setListError("Impossible de charger les cours sauvegardés.");
      } finally {
        setLoadingList(false);
      }
    };
    loadCourses();
  }, []);

  // Effet pour enregistrer le Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker enregistré avec succès:', registration);
        })
        .catch(error => {
          console.error('Échec de l\'enregistrement du Service Worker:', error);
        });
    }
  }, []);

  // Filtrage des cours
  const filteredCours = useMemo(() => {
    return uploadedCours.filter(cours =>
      cours.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uploadedCours, searchTerm]);

  // Formatage des noms de fichiers
  const formatFileName = (fileName) => {
    let title = fileName.replace(/\.pdf$/i, '');
    title = title.replace(/[_-]/g, ' ');
    title = title.replace(/\b\w/g, c => c.toUpperCase());
    return title;
  };

  // Gestion de l'ajout de PDF
  const handleAddPdf = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setListError("Seuls les fichiers PDF sont acceptés");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setListError("La taille du fichier ne doit pas dépasser 15MB");
      return;
    }

    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onload = async (event) => {
      const fileUrl = event.target.result;
      const newCours = {
        id: Date.now(),
        title: formatFileName(file.name),
        category: "Personnel",
        level: "Tous niveaux",
        file: fileUrl,
        description: "Document ajouté manuellement",
        isUploaded: true,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB"
      };

      try {
        await addCourseToDb(newCours);
        setUploadedCours(prev => [...prev, newCours]);
        setListError(null);
        setSelectedCours(newCours);
        setLoadingPdf(true);
      } catch (error) {
        console.error("Erreur lors de l'ajout du cours à IndexedDB:", error);
        setListError("Erreur lors de la sauvegarde du fichier.");
      } finally {
        setUploadProgress(null);
      }
    };

    reader.onerror = () => {
      setListError("Erreur lors de la lecture du fichier");
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Chargement d'un cours
  const handleLoadCours = (cours) => {
    setLoadingPdf(true);
    setPdfError(null);
    setSelectedCours(cours);
  };

  // Gestion du chargement de l'iframe
  const handleIframeLoad = () => {
    setLoadingPdf(false);
  };

  // Téléchargement du PDF
  const handleDownload = () => {
    if (selectedCours) {
      const link = document.createElement('a');
      link.href = selectedCours.file;
      link.download = selectedCours.fileName || `${selectedCours.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
    }
  };

  // Impression du PDF
  const handlePrint = () => {
    if (selectedCours) {
      const printWindow = window.open(selectedCours.file);
      printWindow.print();
    }
  };

  // Effacement des cours
  const clearUploadedCourses = async () => {
    try {
      await clearAllUploadedCoursesFromDb();
      setUploadedCours([]);
      if (selectedCours?.isUploaded) {
        setSelectedCours(null);
      }
      setListError(null);
    } catch (error) {
      console.error("Erreur lors de l'effacement des cours:", error);
      setListError("Erreur lors de l'effacement des cours sauvegardés.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      display: 'flex',
    }}>
      <NavHome />
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Glow effect */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        style={{
          width: showSidebar ? 320 : 0,
          background: 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(99,102,241,0.2)',
          height: '100vh',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
          transition: 'width 0.3s',
        }}
      >
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* En-tête sidebar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a5b4fc' }}>SIKÔLÔ</h2>
              <button
                onClick={() => setShowSidebar(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  padding: 6,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <FiX size={16} />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
              Plateforme d'apprentissage numérique
            </p>
          </div>

          {/* Barre de recherche */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <FiSearch size={16} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }} />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
          </div>

          {/* Bouton d'ajout */}
          <div style={{ marginBottom: 20 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current.click()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(16,185,129,0.2)',
              }}
            >
              <FiUpload size={16} />
              Ajouter un PDF
            </motion.button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleAddPdf}
              style={{ display: 'none' }}
            />

            {uploadProgress !== null && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  width: '100%',
                  height: 4,
                  background: '#1e293b',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: '#10b981',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <p style={{ color: '#10b981', fontSize: '0.7rem', textAlign: 'center', marginTop: 4 }}>
                  {uploadProgress}% chargé
                </p>
              </div>
            )}

            {listError && (
              <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: 8, textAlign: 'center' }}>
                {listError}
              </p>
            )}

            {uploadedCours.length > 0 && (
              <button
                onClick={clearUploadedCourses}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '8px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Effacer tous les cours
              </button>
            )}
          </div>

          {/* Liste des cours */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <h3 style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 12 }}>
              Cours disponibles ({filteredCours.length})
            </h3>

            {loadingList ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  border: '3px solid rgba(99,102,241,0.1)',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            ) : filteredCours.length === 0 ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: '#64748b',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
              }}>
                <FiBook size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: '0.9rem' }}>
                  {searchTerm ? 'Aucun résultat' : 'Aucun cours'}
                </p>
                <p style={{ fontSize: '0.7rem', marginTop: 4 }}>
                  Ajoutez des PDF pour commencer
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredCours.map((cours) => (
                  <motion.div
                    key={cours.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleLoadCours(cours)}
                    style={{
                      padding: 16,
                      background: selectedCours?.id === cours.id
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${
                        selectedCours?.id === cours.id
                          ? '#6366f1'
                          : 'rgba(99,102,241,0.2)'
                      }`,
                      borderRadius: 12,
                      marginBottom: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <FiBookOpen size={14} color="#6366f1" />
                      <h4 style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>
                        {cours.title}
                      </h4>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: 4 }}>
                      {cours.fileSize}
                    </p>
                    <div style={{
                      padding: '2px 6px',
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: 4,
                      display: 'inline-block',
                    }}>
                      <span style={{ color: '#10b981', fontSize: '0.6rem' }}>Manuel</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Bouton pour ouvrir la sidebar */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            position: 'fixed',
            left: 20,
            top: 20,
            zIndex: 20,
            padding: 12,
            background: 'rgba(15,23,42,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            color: '#a5b4fc',
            cursor: 'pointer',
          }}
        >
          <FiBookOpen size={20} />
        </button>
      )}

      {/* Zone de contenu principal */}
      <main style={{ flex: 1, position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column' }}>
        {/* En-tête */}
        <header style={{
          padding: '16px 24px',
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/quizzes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <FiArrowLeft size={14} />
              Retour
            </button>
            
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
                {selectedCours ? selectedCours.title : 'Sélectionnez un cours'}
              </h1>
              {selectedCours && (
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {selectedCours.fileSize}
                </p>
              )}
            </div>
          </div>

          {selectedCours && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  color: '#10b981',
                  cursor: 'pointer',
                }}
              >
                <FiDownload size={14} />
                Télécharger
              </button>
              <button
                onClick={handlePrint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 8,
                  color: '#a5b4fc',
                  cursor: 'pointer',
                }}
              >
                <FiPrinter size={14} />
                Imprimer
              </button>
            </div>
          )}
        </header>

        {/* Visualiseur PDF */}
        <div style={{ flex: 1, padding: 24 }}>
          {loadingPdf ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: '3px solid rgba(99,102,241,0.1)',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }} />
                <p style={{ color: '#94a3b8' }}>Chargement du PDF...</p>
              </div>
            </div>
          ) : pdfError ? (
            <div style={{
              maxWidth: 600,
              margin: '100px auto',
              padding: 32,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444',
              borderRadius: 16,
              textAlign: 'center',
            }}>
              <FiBook size={48} color="#ef4444" style={{ marginBottom: 16 }} />
              <h3 style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Erreur de chargement
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: 16 }}>{pdfError}</p>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
            </div>
          ) : selectedCours ? (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <iframe
                src={selectedCours.file}
                title={selectedCours.title}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                onLoad={handleIframeLoad}
                onError={() => {
                  setLoadingPdf(false);
                  setPdfError("Impossible de charger le PDF. Vérifiez que le fichier est valide.");
                }}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <FiBookOpen size={64} color="#1e293b" style={{ marginBottom: 16 }} />
                <h3 style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: 8 }}>
                  Bienvenue sur SIKÔLÔ
                </h3>
                <p style={{ color: '#64748b' }}>
                  Sélectionnez un cours dans la liste ou ajoutez un PDF pour commencer
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
};

export default CoursPlatform;