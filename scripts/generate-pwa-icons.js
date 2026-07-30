// scripts/generate-pwa-icons.js
// Usage: node scripts/generate-pwa-icons.js <chemin-vers-logo>

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs du thème NA2 Quiz
const COLORS = {
  background: '#05071a',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#a5b4fc',
  text: '#f8fafc'
};

// Configuration des icônes à générer
const ICONS = [
  { name: 'icon-192.png', size: 192, padding: 0.1 },
  { name: 'icon-512.png', size: 512, padding: 0.1 },
  { name: 'icon-512-maskable.png', size: 512, padding: 0.2, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, padding: 0.12 },
  { name: 'favicon-32.png', size: 32, padding: 0.05 },
  { name: 'favicon-16.png', size: 16, padding: 0.05 }
];

// Icônes de raccourcis avec texte
const SHORTCUT_ICONS = [
  { name: 'shortcut-quiz.png', size: 96, text: 'Quiz', icon: '🎯' },
  { name: 'shortcut-dashboard.png', size: 96, text: 'Dash', icon: '📊' },
  { name: 'shortcut-create.png', size: 96, text: 'Créer', icon: '✨' },
  { name: 'shortcut-profile.png', size: 96, text: 'Profil', icon: '👤' }
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Charge une image depuis un fichier
 */
async function loadLogo(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Fichier non trouvé: ${fullPath}`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    
    if (ext === '.svg') {
      // Pour SVG, utiliser sharp pour le convertir
      const buffer = await sharp(fullPath).png().toBuffer();
      return loadImage(buffer);
    }
    
    return loadImage(fullPath);
  } catch (error) {
    console.error('❌ Erreur chargement logo:', error.message);
    throw error;
  }
}

/**
 * Redimensionne une image en gardant les proportions
 */
function resizeImage(image, targetSize, padding = 0.1) {
  const canvas = createCanvas(targetSize, targetSize);
  const ctx = canvas.getContext('2d');

  // Fond avec dégradé
  const gradient = ctx.createLinearGradient(0, 0, targetSize, targetSize);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Calculer la taille du logo
  const logoSize = targetSize * (1 - padding * 2);
  const scale = Math.min(logoSize / image.width, logoSize / image.height);
  
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  
  const x = (targetSize - scaledWidth) / 2;
  const y = (targetSize - scaledHeight) / 2;

  // Ombre portée
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = targetSize * 0.05;
  ctx.shadowOffsetX = targetSize * 0.01;
  ctx.shadowOffsetY = targetSize * 0.01;

  // Dessiner le logo
  ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';

  // Bordure décorative
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = targetSize * 0.02;
  ctx.beginPath();
  ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2 - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}

/**
 * Crée une icône de raccourci avec texte
 */
function createShortcutIcon(size, text, emoji) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond avec dégradé
  const gradient = ctx.createLinearGradient(0, 0, size, size * 0.7);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Cercle de fond pour l'emoji
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.35, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Emoji
  ctx.font = `${size * 0.25}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(emoji, size / 2, size * 0.35);

  // Texte
  ctx.font = `bold ${size * 0.12}px "Nunito", "Segoe UI", sans-serif`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(text, size / 2, size * 0.7);

  return canvas;
}

/**
 * Génère un favicon .ico à partir des PNG
 */
async function generateFaviconIco(outputDir) {
  try {
    const favicon16 = await loadImage(path.join(outputDir, 'favicon-16.png'));
    const favicon32 = await loadImage(path.join(outputDir, 'favicon-32.png'));
    
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    // Dessiner les deux versions (16x16 et 32x32 seront dans le .ico)
    ctx.drawImage(favicon32, 0, 0, 32, 32);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), buffer);
    
    console.log('   ✅ favicon.ico généré');
  } catch (error) {
    console.warn('   ⚠️ Impossible de générer favicon.ico:', error.message);
  }
}

/**
 * Génère le fichier manifest.webmanifest
 */
function generateManifest(outputDir, siteName = 'NA2 Quiz', shortName = 'NA2 Quiz') {
  const manifest = {
    name: siteName,
    short_name: shortName,
    description: 'Plateforme de quiz intelligente propulsée par l\'IA',
    theme_color: COLORS.primary,
    background_color: COLORS.background,
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Nouveau Quiz',
        short_name: 'Quiz',
        description: 'Commencer un nouveau quiz',
        url: '/start',
        icons: [{ src: '/shortcut-quiz.png', sizes: '96x96' }]
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Voir votre tableau de bord',
        url: '/dashboard',
        icons: [{ src: '/shortcut-dashboard.png', sizes: '96x96' }]
      },
      {
        name: 'Créer un Quiz',
        short_name: 'Créer',
        description: 'Créer un nouveau quiz',
        url: '/create',
        icons: [{ src: '/shortcut-create.png', sizes: '96x96' }]
      },
      {
        name: 'Profil',
        short_name: 'Profil',
        description: 'Voir votre profil',
        url: '/profile',
        icons: [{ src: '/shortcut-profile.png', sizes: '96x96' }]
      }
    ],
    categories: ['education', 'productivity', 'learning'],
    screenshots: [],
    lang: 'fr',
    dir: 'ltr',
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    prefer_related_applications: false
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('   ✅ manifest.webmanifest généré');
}

/**
 * Génère un logo SVG de fallback si aucun logo fourni
 */
function generateFallbackLogo(outputDir) {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Texte "NA2"
  ctx.font = `bold ${size * 0.25}px "Nunito", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.fillText('NA2', size / 2, size * 0.45);

  // Texte "QUIZ"
  ctx.font = `bold ${size * 0.12}px "Nunito", "Segoe UI", sans-serif`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('QUIZ', size / 2, size * 0.65);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, 'fallback-logo.png'), buffer);
  
  return loadImage(buffer);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function generateIcons(logoPath, outputDir = './public') {
  console.log('\n🎨 ==========================================');
  console.log('🎨 GÉNÉRATION DES ICÔNES PWA - NA2 QUIZ');
  console.log('🎨 ==========================================\n');

  // Créer le dossier de sortie
  const absoluteOutputDir = path.resolve(outputDir);
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }
  console.log(`📁 Dossier de sortie: ${absoluteOutputDir}\n`);

  // Charger le logo
  let logo;
  let usingFallback = false;
  
  if (logoPath) {
    try {
      console.log('🖼️  Chargement du logo...');
      logo = await loadLogo(logoPath);
      console.log(`   ✅ Logo chargé: ${path.basename(logoPath)} (${logo.width}x${logo.height})\n`);
    } catch (error) {
      console.warn('⚠️  Impossible de charger le logo, utilisation du fallback...');
      usingFallback = true;
    }
  } else {
    usingFallback = true;
  }

  if (usingFallback || !logo) {
    console.log('🎨 Génération du logo fallback...');
    logo = await generateFallbackLogo(absoluteOutputDir);
    console.log('   ✅ Logo fallback généré\n');
  }

  // Générer les icônes standards
  console.log('🔄 Génération des icônes PWA...');
  for (const icon of ICONS) {
    const canvas = resizeImage(logo, icon.size, icon.padding);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(absoluteOutputDir, icon.name), buffer);
    console.log(`   ✅ ${icon.name} (${icon.size}x${icon.size})`);
  }

  // Générer les icônes de raccourcis
  console.log('\n🔗 Génération des icônes de raccourcis...');
  for (const shortcut of SHORTCUT_ICONS) {
    const canvas = createShortcutIcon(shortcut.size, shortcut.text, shortcut.icon);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(absoluteOutputDir, shortcut.name), buffer);
    console.log(`   ✅ ${shortcut.name} (${shortcut.size}x${shortcut.size})`);
  }

  // Générer le favicon.ico
  console.log('\n🌟 Génération du favicon...');
  await generateFaviconIco(absoluteOutputDir);

  // Générer le manifest
  console.log('\n📋 Génération du manifest...');
  generateManifest(absoluteOutputDir, 'NA2 Quiz - Apprentissage Intelligent', 'NA2 Quiz');

  // Copier le logo original dans public
  if (logoPath && fs.existsSync(logoPath)) {
    const ext = path.extname(logoPath);
    const logoDest = path.join(absoluteOutputDir, `logo${ext}`);
    fs.copyFileSync(logoPath, logoDest);
    console.log(`\n📋 Logo copié: ${logoDest}`);
  }

  console.log('\n🎉 ==========================================');
  console.log('🎉 GÉNÉRATION TERMINÉE AVEC SUCCÈS !');
  console.log('🎉 ==========================================');
  
  console.log('\n📱 Icônes générées dans:', absoluteOutputDir);
  console.log('\n📝 Pour utiliser ces icônes:');
  console.log('   1. Assurez-vous que les fichiers sont dans /public');
  console.log('   2. Le manifest.webmanifest est déjà configuré');
  console.log('   3. Testez avec: npm run dev\n');
}

// ============================================
// EXÉCUTION
// ============================================
const logoPath = process.argv[2];
const outputDir = process.argv[3] || './public';

generateIcons(logoPath, outputDir).catch(console.error);