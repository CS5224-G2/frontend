const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

function patchExpoPlist() {
  const targetPath = path.join(projectRoot, 'node_modules', '@expo', 'plist', 'build', 'parse.js');
  const original = ".parseFromString(xml);";
  const patched = ".parseFromString(xml, 'application/xml');";

  if (!fs.existsSync(targetPath)) {
    return;
  }

  const source = fs.readFileSync(targetPath, 'utf8');

  if (source.includes(patched)) {
    return;
  }

  if (!source.includes(original)) {
    console.warn('[fix-expo-plist] Expected parser call not found; skipping patch.');
    return;
  }

  fs.writeFileSync(targetPath, source.replace(original, patched), 'utf8');
  console.log('[fix-expo-plist] Patched @expo/plist to pass application/xml to DOMParser.');
}

function syncExpoSqliteSources() {
  const expoSqliteRoot = path.join(projectRoot, 'node_modules', 'expo-sqlite');
  if (!fs.existsSync(expoSqliteRoot)) {
    return;
  }

  const podfilePropertiesPath = path.join(projectRoot, 'ios', 'Podfile.properties.json');
  let useSQLCipher = false;

  if (fs.existsSync(podfilePropertiesPath)) {
    try {
      const podfileProperties = JSON.parse(fs.readFileSync(podfilePropertiesPath, 'utf8'));
      useSQLCipher = podfileProperties['expo.sqlite.useSQLCipher'] === 'true';
    } catch (error) {
      console.warn(
        '[fix-expo-sqlite] Failed to read Podfile.properties.json:',
        error instanceof Error ? error.message : error
      );
    }
  }

  const vendorDir = path.join(expoSqliteRoot, 'vendor', useSQLCipher ? 'sqlcipher' : 'sqlite3');
  const iosDir = path.join(expoSqliteRoot, 'ios');

  function needsCopy(sourcePath, destinationPath) {
    if (!fs.existsSync(destinationPath)) {
      return true;
    }

    const sourceBuffer = fs.readFileSync(sourcePath);
    const destinationBuffer = fs.readFileSync(destinationPath);
    return !sourceBuffer.equals(destinationBuffer);
  }

  for (const fileName of ['sqlite3.c', 'sqlite3.h']) {
    const sourcePath = path.join(vendorDir, fileName);
    const destinationPath = path.join(iosDir, fileName);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`[fix-expo-sqlite] Missing vendored source: ${sourcePath}`);
      continue;
    }

    if (needsCopy(sourcePath, destinationPath)) {
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`[fix-expo-sqlite] Synced ${fileName} for CocoaPods.`);
    }
  }
}

try {
  patchExpoPlist();
  syncExpoSqliteSources();
} catch (error) {
  console.warn('[postinstall-fixes] Failed to apply postinstall fixes:', error instanceof Error ? error.message : error);
}
