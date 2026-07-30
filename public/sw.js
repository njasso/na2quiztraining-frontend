// public/sw.js
const CACHE_NAME = 'na2quiz-v1';
const OFFLINE_URL = '/offline.html';

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation - Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache pour les requêtes API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API Requests - Network First avec fallback cache
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache la réponse pour usage hors ligne
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline - retourner la version en cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si pas de cache, retourner une réponse vide structurée
            if (request.headers.get('Accept')?.includes('application/json')) {
              return new Response(JSON.stringify({
                success: false,
                offline: true,
                message: 'Vous êtes hors ligne. Les données seront synchronisées dès votre reconnexion.'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Assets statiques - Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Navigation - Network First avec fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Par défaut - Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  } else if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

// Fonction de synchronisation des résultats de quiz
async function syncQuizResults() {
  const db = await openDB();
  const pendingResults = await db.getAll('pendingResults');
  
  for (const result of pendingResults) {
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      
      if (response.ok) {
        await db.delete('pendingResults', result.id);
      }
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  }
}

// Ouvrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NA2QuizDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingResults')) {
        db.createObjectStore('pendingResults', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('quizzes')) {
        db.createObjectStore('quizzes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'userId' });
      }
    };
  });
}