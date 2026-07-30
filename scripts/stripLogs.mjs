// scripts/stripLogs.mjs
// Supprime tous les console.debug/log de debug (emojis) du code source frontend.
// Usage : node scripts/stripLogs.mjs [--dry-run]
//
// Ce script est sûr : il préserve les console.error et console.warn
// car ceux-ci sont utiles en production pour capturer de vraies erreurs.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR   = path.resolve(__dirname, '../src');
const DRY_RUN   = process.argv.includes('--dry-run');

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns à supprimer (lignes entières contenant ces appels)
const PATTERNS = [
  /^\s*console\.log\(.*\);\s*$/gm,
  /^\s*console\.debug\(.*\);\s*$/gm,
  /^\s*console\.info\(.*\);\s*$/gm,
];

let totalFiles    = 0;
let modifiedFiles = 0;
let totalLines    = 0;

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content    = original;
  let removed    = 0;

  for (const pattern of PATTERNS) {
    const matches = content.match(pattern);
    if (matches) removed += matches.length;
    content = content.replace(pattern, '');
  }

  if (content !== original) {
    modifiedFiles++;
    totalLines += removed;
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log(`  ${DRY_RUN ? '[dry]' : '✓'} ${path.relative(SRC_DIR, filePath)} — ${removed} ligne(s) supprimée(s)`);
  }

  totalFiles++;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
      processFile(fullPath);
    }
  }
}

console.log(`\nSuppression des console.log${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);
walkDir(SRC_DIR);
console.log(`\nRésultat : ${modifiedFiles}/${totalFiles} fichier(s) modifié(s), ${totalLines} ligne(s) supprimée(s)\n`);
