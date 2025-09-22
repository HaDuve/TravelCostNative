#!/usr/bin/env node

/**
 * Development Build Script
 * 
 * Builds the app for development/testing on emulators and local devices
 * - Android: Creates APK for emulator/device installation
 * - iOS: Creates simulator build or device build
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  android: {
    buildType: 'debug',
    outputDir: './android/app/build/outputs/apk/debug',
    apkName: 'app-debug.apk'
  },
  ios: {
    scheme: 'Budget',
    configuration: 'Debug',
    outputDir: './ios/build',
    simulator: true
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

function checkPrerequisites() {
  log('Checking prerequisites...', 'yellow');
  
  // Check if we're in the right directory
  if (!fs.existsSync('./package.json')) {
    log('Error: package.json not found. Please run this script from the project root.', 'red');
    process.exit(1);
  }
  
  // Check if node_modules exists
  if (!fs.existsSync('./node_modules')) {
    log('Installing dependencies...', 'yellow');
    execCommand('pnpm install');
  }
  
  // Check for required tools
  try {
    execSync('npx expo --version', { stdio: 'pipe' });
  } catch (error) {
    log('Error: Expo CLI not found. Please install it globally: npm install -g @expo/cli', 'red');
    process.exit(1);
  }
  
  log('Prerequisites check passed!', 'green');
}

function buildAndroid() {
  log('Building Android app...', 'yellow');
  
  // Clean previous builds
  execCommand('cd android && ./gradlew clean');
  
  // Build debug APK
  execCommand('cd android && ./gradlew assembleDebug');
  
  // Check if APK was created
  const apkPath = path.join(CONFIG.android.outputDir, CONFIG.android.apkName);
  if (fs.existsSync(apkPath)) {
    log(`Android APK built successfully: ${apkPath}`, 'green');
    log(`APK size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(2)} MB`, 'blue');
  } else {
    log('Error: APK not found after build', 'red');
    process.exit(1);
  }
}

function buildiOS() {
  log('Building iOS app...', 'yellow');
  
  // Install pods if needed
  if (!fs.existsSync('./ios/Pods')) {
    log('Installing iOS dependencies...', 'yellow');
    execCommand('cd ios && pod install');
  }
  
  // Build for simulator
  const buildCommand = `cd ios && xcodebuild -workspace Budget.xcworkspace -scheme ${CONFIG.ios.scheme} -configuration ${CONFIG.ios.configuration} -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' build`;
  
  execCommand(buildCommand);
  
  log('iOS build completed successfully!', 'green');
  log('To run on simulator: npx expo run:ios', 'blue');
}

function installOnDevice(platform) {
  if (platform === 'android') {
    log('Installing Android APK on connected device...', 'yellow');
    const apkPath = path.join(CONFIG.android.outputDir, CONFIG.android.apkName);
    
    try {
      execCommand(`adb install -r "${apkPath}"`);
      log('Android app installed successfully!', 'green');
    } catch (error) {
      log('Error installing APK. Make sure a device is connected and USB debugging is enabled.', 'red');
    }
  } else if (platform === 'ios') {
    log('For iOS device installation, use: npx expo run:ios --device', 'blue');
  }
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all';
  const install = args.includes('--install');
  
  log('🚀 Starting development build...', 'bright');
  
  checkPrerequisites();
  
  if (platform === 'all' || platform === 'android') {
    buildAndroid();
    if (install) {
      installOnDevice('android');
    }
  }
  
  if (platform === 'all' || platform === 'ios') {
    buildiOS();
    if (install) {
      installOnDevice('ios');
    }
  }
  
  log('✅ Development build completed!', 'green');
  log('Next steps:', 'blue');
  log('- Android: APK is ready for installation', 'blue');
  log('- iOS: Use "npx expo run:ios" to run on simulator', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = { buildAndroid, buildiOS, checkPrerequisites };
