export const syncLocalContentWithFirebase = async () => {
  const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  const localChanges = StorageService.getLocalContent(STORAGE_KEYS.QUIZZES)
    .filter(item => item.lastUpdated > lastSync);
  
  await Promise.all(localChanges.map(pushToFirebase));
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now());
};