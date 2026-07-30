// services/database.js
import { openDB } from 'idb';
import { db } from './firebase.config';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'ExamsDB';
const EXAMS_STORE = 'exams';
const DB_VERSION = 1;

const idb = {
  db: openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(EXAMS_STORE)) {
        db.createObjectStore(EXAMS_STORE, { keyPath: 'id' });
      }
    }
  }),

  async put(storeName, data) {
    return (await this.db).put(storeName, data);
  },

  async get(storeName, id) {
    return (await this.db).get(storeName, id);
  },

  async getAll(storeName) {
    return (await this.db).getAll(storeName);
  },

  async delete(storeName, id) {
    return (await this.db).delete(storeName, id);
  }
};

const database = {
  async saveExam(exam) {
    let examWithId;
    try {
      const docRef = await addDoc(collection(db, 'exams'), {
        ...exam,
        createdAt: new Date().toISOString(),
        status: 'published'
      });
      examWithId = { ...exam, id: docRef.id };
    } catch (error) {
      console.warn('Erreur Firestore, sauvegarde locale...', error);
      examWithId = { ...exam, id: uuidv4() };
    }

    try {
      await idb.put(EXAMS_STORE, examWithId);
      return examWithId;
    } catch (err) {
      console.error('Erreur IndexedDB:', err);
      throw new Error('Échec de la sauvegarde locale');
    }
  },

  async getExamById(id) {
    const localExam = await idb.get(EXAMS_STORE, id);
    if (localExam) return localExam;

    try {
      const docRef = doc(db, 'exams', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const exam = { id: docSnap.id, ...docSnap.data() };
        await idb.put(EXAMS_STORE, exam);
        return exam;
      }
    } catch (error) {
      console.error('Erreur de récupération:', error);
    }
    return null;
  },

  async getAllExams() {
    return idb.getAll(EXAMS_STORE);
  },

  async deleteExam(id) {
    try {
      await idb.delete(EXAMS_STORE, id);
      return true;
    } catch (error) {
      console.error('Erreur de suppression:', error);
      return false;
    }
  }
};

export default database;
