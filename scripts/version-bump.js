#!/usr/bin/env node

/**
 * Version Bump Script for SmartKenya Mobile App
 * 
 * Usage:
 *   npm run version:patch  - Bug fixes (1.0.0 -> 1.0.1)
 *   npm run version:minor  - New features (1.0.0 -> 1.1.0)
 *   npm run version:major  - Breaking changes (1.0.0 -> 2.0.0)
 *   npm run version:build  - Increment build number only
 */

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '../version.json');
const PACKAGE_FILE = path.join(__dirname, '../package.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function incrementVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

function updateVersions() {
  const type = process.argv[2] || 'patch';
  
  // Read current versions
  const versionData = readJSON(VERSION_FILE);
  const packageData = readJSON(PACKAGE_FILE);
  
  const currentVersion = versionData.version;
  const currentBuildNumber = versionData.buildNumber;
  
  // Calculate new version
  let newVersion = currentVersion;
  let newBuildNumber = currentBuildNumber;
  
  if (type === 'build') {
    // Only increment build number
    newBuildNumber = currentBuildNumber + 1;
  } else {
    // Increment version and build number
    newVersion = incrementVersion(currentVersion, type);
    newBuildNumber = currentBuildNumber + 1;
  }
  
  // Update version.json
  versionData.version = newVersion;
  versionData.buildNumber = newBuildNumber;
  versionData.lastUpdated = new Date().toISOString();
  versionData.ios.CFBundleShortVersionString = newVersion;
  versionData.ios.CFBundleVersion = newBuildNumber.toString();
  versionData.android.versionName = newVersion;
  versionData.android.versionCode = newBuildNumber;
  
  // Update package.json
  packageData.version = newVersion;
  
  // Write updated files
  writeJSON(VERSION_FILE, versionData);
  writeJSON(PACKAGE_FILE, packageData);
  
  // Log the changes
  console.log('\n✅ Version updated successfully!\n');
  console.log(`📱 App Version: ${currentVersion} → ${newVersion}`);
  console.log(`🔢 Build Number: ${currentBuildNumber} → ${newBuildNumber}`);
  console.log(`\n📦 iOS: ${newVersion} (${newBuildNumber})`);
  console.log(`🤖 Android: ${newVersion} (${newBuildNumber})`);
  console.log(`\n⏰ Updated: ${versionData.lastUpdated}\n`);
  console.log('Next steps:');
  console.log('  1. Update CHANGELOG.md with your changes');
  console.log('  2. Commit: git add . && git commit -m "chore: bump version to v' + newVersion + '"');
  console.log('  3. Tag: git tag v' + newVersion);
  console.log('  4. Build: npm run build && npx cap sync');
  console.log('  5. Push: git push && git push --tags\n');
}

try {
  updateVersions();
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}
