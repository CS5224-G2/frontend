const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'node_modules', '@expo', 'plist', 'build', 'parse.js');
const original = ".parseFromString(xml);";
const patched = ".parseFromString(xml, 'application/xml');";

try {
  if (!fs.existsSync(targetPath)) {
    process.exit(0);
  }

  const source = fs.readFileSync(targetPath, 'utf8');

  if (source.includes(patched)) {
    process.exit(0);
  }

  if (!source.includes(original)) {
    console.warn('[fix-expo-plist] Expected parser call not found; skipping patch.');
    process.exit(0);
  }

  fs.writeFileSync(targetPath, source.replace(original, patched), 'utf8');
  console.log('[fix-expo-plist] Patched @expo/plist to pass application/xml to DOMParser.');
} catch (error) {
  console.warn('[fix-expo-plist] Failed to patch @expo/plist:', error instanceof Error ? error.message : error);
}
