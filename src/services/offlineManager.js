// src/services/offlineManager.js - VERSION COMPLÈTE CORRIGÉE

class OfflineManager {
  constructor() {
    this.db = null;
    this.dbName = 'NA2QuizDB';
    this.version = 1;
    this.initDB();
  }

  // Initialiser IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Store pour les résultats en attente
        if (!db.objectStoreNames.contains('pendingResults')) {
          db.createObjectStore('pendingResults', { keyPath: 'id', autoIncrement: true });
        }
        
        // Store pour les quiz téléchargés
        if (!db.objectStoreNames.contains('cachedQuizzes')) {
          db.createObjectStore('cachedQuizzes', { keyPath: 'id' });
        }
        
        // Store pour la progression
        if (!db.objectStoreNames.contains('userProgress')) {
          db.createObjectStore('userProgress', { keyPath: 'key' });
        }
        
        // Store pour les requêtes en attente
        if (!db.objectStoreNames.contains('pendingRequests')) {
          const store = db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // S'assurer que la DB est initialisée
  async ensureDB() {
    if (this.db) return this.db;
    return this.initDB();
  }

  // ============================================
  // RÉSULTATS DE QUIZ (MODE OFFLINE)
  // ============================================

  // Sauvegarder un résultat de quiz
  async saveQuizResult(result) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingResults'], 'readwrite');
      const store = transaction.objectStore('pendingResults');
      
      const record = {
        ...result,
        timestamp: Date.now(),
        synced: false
      };
      
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer les résultats en attente
  async getPendingResults() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingResults'], 'readonly');
      const store = transaction.objectStore('pendingResults');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Supprimer un résultat synchronisé
  async removePendingResult(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingResults'], 'readwrite');
      const store = transaction.objectStore('pendingResults');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Compter les résultats en attente
  async countPendingResults() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingResults'], 'readonly');
      const store = transaction.objectStore('pendingResults');
      
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // QUIZ EN CACHE
  // ============================================

  // Mettre en cache un quiz
  async cacheQuiz(quiz) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedQuizzes'], 'readwrite');
      const store = transaction.objectStore('cachedQuizzes');
      
      const record = {
        ...quiz,
        cachedAt: Date.now()
      };
      
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer un quiz depuis le cache
  async getCachedQuiz(quizId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedQuizzes'], 'readonly');
      const store = transaction.objectStore('cachedQuizzes');
      
      const request = store.get(quizId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer tous les quiz en cache
  async getAllCachedQuizzes() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedQuizzes'], 'readonly');
      const store = transaction.objectStore('cachedQuizzes');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Supprimer un quiz du cache
  async removeCachedQuiz(quizId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedQuizzes'], 'readwrite');
      const store = transaction.objectStore('cachedQuizzes');
      
      const request = store.delete(quizId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Vider tout le cache des quiz
  async clearCachedQuizzes() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedQuizzes'], 'readwrite');
      const store = transaction.objectStore('cachedQuizzes');
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // PROGRESSION UTILISATEUR
  // ============================================

  // Sauvegarder la progression
  async saveProgress(key, value) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer la progression
  async getProgress(key) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Récupérer toute la progression
  async getAllProgress() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Supprimer une progression
  async removeProgress(key) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // REQUÊTES EN ATTENTE
  // ============================================

  // Ajouter une requête API en attente
  async addPendingRequest(request) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      
      const record = {
        url: request.url,
        method: request.method || 'GET',
        headers: request.headers || {},
        body: request.body || null,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      const requestObj = store.add(record);
      requestObj.onsuccess = () => resolve(requestObj.result);
      requestObj.onerror = () => reject(requestObj.error);
    });
  }

  // Récupérer les requêtes en attente
  async getPendingRequests() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Supprimer une requête en attente
  async removePendingRequest(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // SYNCHRONISATION
  // ============================================

  // Synchroniser les résultats en attente
  async syncPendingResults() {
    const results = await this.getPendingResults();
    
    for (const result of results) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(result)
        });
        
        if (response.ok) {
          await this.removePendingResult(result.id);
          console.log('✅ Résultat synchronisé:', result.id);
        }
      } catch (error) {
        console.error('❌ Erreur synchronisation résultat:', error);
      }
    }
  }

  // Synchroniser les requêtes en attente
  async syncPendingRequests() {
    const requests = await this.getPendingRequests();
    
    for (const req of requests) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(req.url, {
          method: req.method,
          headers: {
            ...req.headers,
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: req.body
        });
        
        if (response.ok) {
          await this.removePendingRequest(req.id);
          console.log('✅ Requête synchronisée:', req.id);
        }
      } catch (error) {
        console.error('❌ Erreur synchronisation requête:', error);
      }
    }
  }

  // Synchroniser toutes les données en attente
  async syncAll() {
    if (!navigator.onLine) {
      console.log('📴 Offline - synchronisation reportée');
      return { success: false, offline: true };
    }

    await this.ensureDB();
    
    const resultsCount = await this.countPendingResults();
    const requests = await this.getPendingRequests();
    
    console.log(`🔄 Synchronisation: ${resultsCount} résultats, ${requests.length} requêtes`);
    
    await this.syncPendingResults();
    await this.syncPendingRequests();
    
    const remainingResults = await this.countPendingResults();
    const remainingRequests = await this.getPendingRequests();
    
    return {
      success: true,
      syncedResults: resultsCount - remainingResults,
      syncedRequests: requests.length - remainingRequests.length,
      remainingResults,
      remainingRequests: remainingRequests.length
    };
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  // Vérifier l'état de la connexion
  isOnline() {
    return navigator.onLine;
  }

  // Écouter les changements de connexion
  onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // Obtenir des statistiques sur les données hors ligne
  async getStats() {
    await this.ensureDB();
    
    const [pendingResults, cachedQuizzes, pendingRequests, progress] = await Promise.all([
      this.countPendingResults(),
      this.getAllCachedQuizzes().then(q => q.length),
      this.getPendingRequests().then(r => r.length),
      this.getAllProgress().then(p => p.length)
    ]);
    
    return {
      pendingResults,
      cachedQuizzes,
      pendingRequests,
      progressEntries: progress,
      isOnline: this.isOnline(),
      dbName: this.dbName,
      version: this.version
    };
  }

  // Vider toutes les données (utile pour le debug)
  async clearAllData() {
    await this.ensureDB();
    
    const stores = ['pendingResults', 'cachedQuizzes', 'userProgress', 'pendingRequests'];
    
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('🗑️ Toutes les données hors ligne ont été effacées');
  }
}

// Instance singleton
export const offlineManager = new OfflineManager();
export default offlineManager;