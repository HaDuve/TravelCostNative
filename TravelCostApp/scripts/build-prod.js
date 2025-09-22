#!/usr/bin/env node

/**
 * Production Build Script
 * 
 * Builds the app for production deployment
 * - Android: Creates AAB (Android App Bundle) for Play Store
 * - iOS: Creates IPA for App Store
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  android: {
    buildType: 'release',
    outputDir: './android/app/build/outputs/bundle/release',
    aabName: 'app-release.aab',
    keystorePath: './android/app/release.keystore',
    keystoreAlias: 'release-key'
  },
  ios: {
    scheme: 'Budget',
    configuration: 'Release',
    outputDir: './ios/build',
    archivePath: './ios/build/Budget.xcarchive',
    exportPath: './ios/build/export'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, 'cyan');
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    return result;
  } catch (error) {
    log(`Error running command: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkEnvironment() {
  log('Checking production build environment...', 'yellow');
  
  // Check environment variables
  const requiredEnvVars = [
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_PASSWORD',
    'ANDROID_KEY_ALIAS'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    log(`Missing required environment variables: ${missingVars.join(', ')}`, 'red');
    log('Please set these variables before running production build:', 'yellow');
    missingVars.forEach(varName => {
      log(`  export ${varName}=your_value`, 'blue');
    });
    process.exit(1);
  }
  
  // Check if keystore exists
  if (!fs.existsSync(CONFIG.android.keystorePath)) {
    log(`Android keystore not found at: ${CONFIG.android.keystorePath}`, 'red');
    log('Please create a release keystore for production builds', 'yellow');
    log('You can generate one with: keytool -genkey -v -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000', 'blue');
    process.exit(1);
  }
  
  log('Environment check passed!', 'green');
}

function updateVersionNumbers() {
  log('Updating version numbers...', 'yellow');
  
  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  
  // Get version from app.json (source of truth)
  const version = appJson.expo.version;
  const buildNumber = appJson.expo.ios.buildNumber;
  const versionCode = appJson.expo.android.versionCode;
  
  log(`Version: ${version}`, 'blue');
  log(`iOS Build Number: ${buildNumber}`, 'blue');
  log(`Android Version Code: ${versionCode}`, 'blue');
}

function buildAndroid() {
  log('Building Android production app...', 'yellow');
  
  // Clean previous builds
  execCommand('cd android && ./gradlew clean');
  
  // Build release AAB
  execCommand('cd android && ./gradlew bundleRelease');
  
  // Check if AAB was created
  const aabPath = path.join(CONFIG.android.outputDir, CONFIG.android.aabName);
  if (fs.existsSync(aabPath)) {
    log(`Android AAB built successfully: ${aabPath}`, 'green');
    log(`AAB size: ${(fs.statSync(aabPath).size / 1024 / 1024).toFixed(2)} MB`, 'blue');
  } else {
    log('Error: AAB not found after build', 'red');
    process.exit(1);
  }
}

function buildiOS() {
  log('Building iOS production app...', 'yellow');
  
  // Install pods
  execCommand('cd ios && pod install');
  
  // Create archive
  const archiveCommand = `cd ios && xcodebuild -workspace Budget.xcworkspace -scheme ${CONFIG.ios.scheme} -configuration ${CONFIG.ios.configuration} -destination generic/platform=iOS -archivePath "${CONFIG.ios.archivePath}" archive`;
  
  execCommand(archiveCommand);
  
  // Export IPA
  const exportCommand = `cd ios && xcodebuild -exportArchive -archivePath "${CONFIG.ios.archivePath}" -exportPath "${CONFIG.ios.exportPath}" -exportOptionsPlist ExportOptions.plist`;
  
  // Check if ExportOptions.plist exists, create if not
  const exportOptionsPath = './ios/ExportOptions.plist';
  if (!fs.existsSync(exportOptionsPath)) {
    log('Creating ExportOptions.plist...', 'yellow');
    const exportOptions = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>AK62F8767Z</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;
    fs.writeFileSync(exportOptionsPath, exportOptions);
  }
  
  execCommand(exportCommand);
  
  // Check if IPA was created
  const ipaPath = path.join(CONFIG.ios.exportPath, 'Budget.ipa');
  if (fs.existsSync(ipaPath)) {
    log(`iOS IPA built successfully: ${ipaPath}`, 'green');
    log(`IPA size: ${(fs.statSync(ipaPath).size / 1024 / 1024).toFixed(2)} MB`, 'blue');
  } else {
    log('Error: IPA not found after build', 'red');
    process.exit(1);
  }
}

function createKeystoreConfig() {
  log('Creating Android keystore configuration...', 'yellow');
  
  const keystoreConfig = `
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}`;
  
  // This would need to be integrated into the actual build.gradle file
  log('Note: Update android/app/build.gradle with the above signing configuration', 'blue');
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all';
  
  log('🏭 Starting production build...', 'bright');
  
  checkEnvironment();
  updateVersionNumbers();
  
  if (platform === 'all' || platform === 'android') {
    buildAndroid();
  }
  
  if (platform === 'all' || platform === 'ios') {
    buildiOS();
  }
  
  log('✅ Production build completed!', 'green');
  log('Next steps:', 'blue');
  log('- Android: Upload AAB to Google Play Console', 'blue');
  log('- iOS: Upload IPA to App Store Connect', 'blue');
  log('- Or use: npm run submit:prod', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = { buildAndroid, buildiOS, checkEnvironment };
