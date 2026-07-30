// src/hooks/useAntiCheat.js — Surveillance côté client (anti-triche)
// Détecte : changement d'onglet, perte de focus, copier/coller, clic droit,
// sortie du plein écran, raccourcis de capture, ouverture des outils de dev.
// Les événements sont envoyés au serveur par lots (économie de requêtes).
import { useEffect, useRef, useState, useCallback } from 'react';
import http from '../services/http';

const FLUSH_MS = 8000;          // envoi groupé toutes les 8 s
const MAX_BUFFER = 25;          // ou dès 25 événements

/**
 * @param {object} opts
 *  - enabled        activer la surveillance (défaut true)
 *  - mode           'quiz' | 'exam'
 *  - quizId, examId identifiants
 *  - strictness     'off' | 'soft' | 'strict'
 *  - requireFullscreen  demander le plein écran (épreuves)
 *  - onAutoSubmit   callback si le serveur demande une soumission d'office
 *  - onWarning      callback (message) pour afficher un avertissement
 */
export default function useAntiCheat({
  enabled = true,
  mode = 'quiz',
  quizId = null,
  examId = null,
  strictness = 'soft',
  requireFullscreen = false,
  onAutoSubmit,
  onWarning,
} = {}) {
  const [sessionId, setSessionId] = useState(null);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [riskLevel, setRiskLevel] = useState('low');
  const [warnings, setWarnings] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const buffer = useRef([]);
  const hiddenSince = useRef(null);
  const blurSince = useRef(null);
  const sessionRef = useRef(null);
  const activeRef = useRef(enabled && strictness !== 'off');

  // ── Empreinte d'appareil (détection de session simultanée) ──
  const fingerprint = useRef(
    (() => {
      try {
        const raw = [
          navigator.userAgent, navigator.language,
          screen.width, screen.height, screen.colorDepth,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 0,
        ].join('|');
        let h = 0;
        for (let i = 0; i < raw.length; i++) { h = (h * 31 + raw.charCodeAt(i)) | 0; }
        return `fp_${Math.abs(h).toString(36)}`;
      } catch { return 'fp_unknown'; }
    })()
  );

  const push = useCallback((type, extra = {}) => {
    if (!activeRef.current) return;
    buffer.current.push({ type, at: new Date().toISOString(), ...extra });
    if (buffer.current.length >= MAX_BUFFER) flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid || !buffer.current.length) return;
    const events = buffer.current.splice(0, buffer.current.length);
    try {
      const { data } = await http.post(`/proctoring/${sid}/events`, { events });
      if (data?.integrityScore != null) setIntegrityScore(data.integrityScore);
      if (data?.riskLevel) setRiskLevel(data.riskLevel);
      if (data?.warning) {
        setWarnings((w) => (w.includes(data.warning) ? w : [...w, data.warning]));
        onWarning?.(data.warning);
      }
      if (data?.shouldAutoSubmit) onAutoSubmit?.('Trop d’anomalies détectées');
    } catch {
      // Hors-ligne : on remet les événements en file pour un prochain envoi
      buffer.current.unshift(...events.slice(-MAX_BUFFER));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAutoSubmit, onWarning]);

  // ── Ouverture de la session ──
  useEffect(() => {
    if (!enabled || strictness === 'off') { activeRef.current = false; return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await http.post('/proctoring/start', {
          mode, quizId, examId, strictness,
          deviceFingerprint: fingerprint.current,
          screen: `${window.screen.width}x${window.screen.height}`,
        });
        if (cancelled) return;
        if (data?.sessionId) {
          sessionRef.current = data.sessionId;
          setSessionId(data.sessionId);
          activeRef.current = true;
        }
      } catch {
        // La surveillance ne doit jamais empêcher de passer le quiz
        activeRef.current = false;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, strictness, mode, quizId, examId]);

  // ── Écouteurs de comportement ──
  useEffect(() => {
    if (!enabled || strictness === 'off') return;

    const onVisibility = () => {
      if (document.hidden) {
        hiddenSince.current = Date.now();
        push('TAB_HIDDEN');
      } else if (hiddenSince.current) {
        const d = Date.now() - hiddenSince.current;
        hiddenSince.current = null;
        push('TAB_VISIBLE', { durationMs: d, detail: `${Math.round(d / 1000)} s hors de l'écran` });
        if (d > 5000) {
          const msg = `Vous avez quitté l'écran pendant ${Math.round(d / 1000)} secondes — cela est enregistré.`;
          setWarnings((w) => [...w.slice(-2), msg]);
          onWarning?.(msg);
        }
      }
    };

    const onBlur = () => { blurSince.current = Date.now(); push('FOCUS_LOST'); };
    const onFocus = () => {
      if (blurSince.current) {
        const d = Date.now() - blurSince.current;
        blurSince.current = null;
        push('FOCUS_BACK', { durationMs: d });
      }
    };

    const onCopy = (e) => { if (strictness === 'strict') e.preventDefault(); push('COPY'); };
    const onCut = (e) => { if (strictness === 'strict') e.preventDefault(); push('CUT'); };
    const onPaste = (e) => { if (strictness === 'strict') e.preventDefault(); push('PASTE'); };
    const onContext = (e) => { if (strictness === 'strict') e.preventDefault(); push('CONTEXT_MENU'); };

    const onKey = (e) => {
      const k = (e.key || '').toLowerCase();
      // Impression / capture
      if ((e.ctrlKey || e.metaKey) && k === 'p') { e.preventDefault(); push('PRINT_ATTEMPT'); return; }
      if (k === 'printscreen') { push('PRINT_ATTEMPT', { detail: 'PrintScreen' }); return; }
      // Outils de développement
      if (k === 'f12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k))) {
        if (strictness === 'strict') e.preventDefault();
        push('DEVTOOLS_SUSPECT', { detail: k });
        return;
      }
      // Copie clavier bloquée en strict
      if (strictness === 'strict' && (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 's', 'u'].includes(k)) {
        e.preventDefault();
        push('SHORTCUT_BLOCKED', { detail: `Ctrl+${k.toUpperCase()}` });
      }
    };

    const onFsChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      push(fs ? 'FULLSCREEN_ENTER' : 'FULLSCREEN_EXIT');
      if (!fs && requireFullscreen) {
        const msg = 'Le plein écran est requis pendant l’épreuve. Merci de le réactiver.';
        setWarnings((w) => [...w.slice(-2), msg]);
        onWarning?.(msg);
      }
    };

    // Détection heuristique des outils de dev (écart taille fenêtre/viewport)
    const devtoolsCheck = setInterval(() => {
      const gapW = window.outerWidth - window.innerWidth;
      const gapH = window.outerHeight - window.innerHeight;
      if (gapW > 220 || gapH > 220) push('DEVTOOLS_SUSPECT', { detail: `écart ${gapW}x${gapH}` });
    }, 15000);

    const timer = setInterval(flush, FLUSH_MS);
    const onBeforeUnload = () => {
      // Envoi best-effort à la fermeture
      const sid = sessionRef.current;
      if (sid && buffer.current.length && navigator.sendBeacon) {
        try {
          const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
          navigator.sendBeacon(`${base}/proctoring/${sid}/events`,
            new Blob([JSON.stringify({ events: buffer.current })], { type: 'application/json' }));
        } catch { /* silencieux */ }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(timer); clearInterval(devtoolsCheck);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, strictness, requireFullscreen, flush, push]);

  /** Demande le plein écran (à appeler sur un clic utilisateur) */
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      return true;
    } catch { return false; }
  }, []);

  /** Clôture la session et renvoie le rapport d'intégrité */
  const finish = useCallback(async ({ resultId = null, autoSubmitted = false } = {}) => {
    const sid = sessionRef.current;
    await flush();
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ignore */ } }
    if (!sid) return null;
    try {
      const { data } = await http.post(`/proctoring/${sid}/finish`, { resultId, autoSubmitted });
      activeRef.current = false;
      return data;
    } catch { return null; }
  }, [flush]);

  return {
    sessionId, integrityScore, riskLevel, warnings,
    isFullscreen, enterFullscreen, finish,
    logEvent: push,
    active: activeRef.current,
  };
}
