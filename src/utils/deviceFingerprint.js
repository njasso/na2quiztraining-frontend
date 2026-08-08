// src/utils/deviceFingerprint.js
// Empreinte d'appareil stable — extraite de hooks/useAntiCheat.js pour être
// partagée entre la surveillance anti-triche ET la limite de 2 appareils
// connectés simultanément (voir AuthContext.jsx, DevicesPage.jsx). Le même
// appareil doit produire le même identifiant dans les deux usages.
let cached = null;

export const getDeviceFingerprint = () => {
  if (cached) return cached;
  try {
    const raw = [
      navigator.userAgent, navigator.language,
      screen.width, screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ].join('|');
    let h = 0;
    for (let i = 0; i < raw.length; i++) { h = (h * 31 + raw.charCodeAt(i)) | 0; }
    cached = `fp_${Math.abs(h).toString(36)}`;
  } catch {
    cached = 'fp_unknown';
  }
  return cached;
};

/** Libellé humain approximatif de l'appareil, pour l'écran de gestion. */
export const getDeviceLabel = () => {
  const ua = navigator.userAgent || '';
  let browser = 'Navigateur';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Appareil';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} sur ${os}`;
};

export default getDeviceFingerprint;
