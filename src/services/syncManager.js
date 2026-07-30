// src/services/syncManager.js
export const syncLocalExams = async () => {
  const db = await openDB('ExamsDB');
  const tx = db.transaction('exams', 'readwrite');
  const exams = await tx.store.getAll();
  
  for(const exam of exams.filter(e => !e.synced)) {
    await setDoc(doc(db, 'exams', exam.id), exam);
    await tx.store.put({ ...exam, synced: true });
  }
};