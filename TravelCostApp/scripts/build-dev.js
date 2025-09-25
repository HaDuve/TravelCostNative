#!/usr/bin/env node

/**
 * Development Build Script
 *
 * Builds the app for development/testing on emulators and local devices
 * - Android: Creates APK for emulator/device installation
 * - iOS: Creates simulator build or device build
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

// Configuration
const CONFIG = {
  android: {
    buildType: "debug",
    outputDir: "./android/app/build/outputs/apk/debug",
    apkName: "app-debug.apk",
  },
  ios: {
    scheme: "Budget",
    configuration: "Debug",
    outputDir: "./ios/build",
    simulator: true,
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`Running: ${command}`, "cyan");
    const result = execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8",
      },
      ...options,
    });
    return result;
  } catch (error) {
    log(`Error running command: ${command}`, "red");
    log(error.message, "red");
    process.exit(1);
  }
}

function checkPrerequisites() {
  log("Checking prerequisites...", "yellow");

  // Check if we're in the right directory
  if (!fs.existsSync("./package.json")) {
    log(
      "Error: package.json not found. Please run this script from the project root.",
      "red"
    );
    process.exit(1);
  }

  // Check if node_modules exists
  if (!fs.existsSync("./node_modules")) {
    log("Installing dependencies...", "yellow");
    execCommand("pnpm install");
  }

  // Check for required tools
  try {
    execSync("npx expo --version", { stdio: "pipe" });
  } catch (error) {
    log(
      "Error: Expo CLI not found. Please install it globally: npm install -g @expo/cli",
      "red"
    );
    process.exit(1);
  }

  log("Prerequisites check passed!", "green");
}

function buildAndroid() {
  log("Building Android app...", "yellow");

  // Clean previous builds
  execCommand("cd android && ./gradlew clean");

  // Build debug APK
  execCommand("cd android && ./gradlew assembleDebug");

  // Check if APK was created
  const apkPath = path.join(CONFIG.android.outputDir, CONFIG.android.apkName);
  if (fs.existsSync(apkPath)) {
    log(`Android APK built successfully: ${apkPath}`, "green");
    log(
      `APK size: ${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(2)} MB`,
      "blue"
    );
  } else {
    log("Error: APK not found after build", "red");
    process.exit(1);
  }
}

function getAvailableSimulators() {
  try {
    const result = execSync("xcrun simctl list devices --json", {
      stdio: "pipe",
      encoding: "utf8",
    });
    const data = JSON.parse(result);
    const availableSims = [];

    Object.keys(data.devices).forEach((runtime) => {
      if (runtime.includes("iOS")) {
        data.devices[runtime].forEach((device) => {
          if (device.state === "Shutdown" || device.state === "Booted") {
            availableSims.push({
              name: device.name,
              udid: device.udid,
              runtime: runtime,
            });
          }
        });
      }
    });

    return availableSims;
  } catch (error) {
    log("Warning: Could not get simulator list, using default", "yellow");
    return [{ name: "iPhone 15", udid: "default", runtime: "iOS 17.0" }];
  }
}

function buildiOS() {
  log("Building iOS app...", "yellow");

  // Check if Xcode is installed
  try {
    execSync("xcodebuild -version", { stdio: "pipe" });
  } catch (error) {
    log(
      "Error: Xcode not found. Please install Xcode from the App Store.",
      "red"
    );
    process.exit(1);
  }

  // Clean previous builds
  if (fs.existsSync("./ios/build")) {
    log("Cleaning previous iOS builds...", "yellow");
    execCommand("cd ios && rm -rf build");
  }

  // Install pods
  log("Installing iOS dependencies...", "yellow");
  execCommand(
    "cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update"
  );

  // Get available simulators
  const simulators = getAvailableSimulators();
  const targetSim = simulators[0] || {
    name: "iPhone 15",
    udid: "default",
    runtime: "iOS 17.0",
  };

  log(`Using simulator: ${targetSim.name} (${targetSim.runtime})`, "blue");

  // Build for simulator
  const buildCommand = `cd ios && xcodebuild -workspace Budget.xcworkspace -scheme ${CONFIG.ios.scheme} -configuration ${CONFIG.ios.configuration} -destination 'platform=iOS Simulator,name=${targetSim.name}' build`;

  try {
    execCommand(buildCommand);
    log("iOS build completed successfully!", "green");
    log("To run on simulator: npx expo run:ios", "blue");
  } catch (error) {
    log("iOS build failed. Common solutions:", "red");
    log(
      "1. Clean build folder: cd ios && rm -rf build && xcodebuild clean",
      "yellow"
    );
    log(
      "2. Reset pods: cd ios && rm -rf Pods Podfile.lock && pod install",
      "yellow"
    );
    log("3. Check Xcode version compatibility", "yellow");
    process.exit(1);
  }
}

function installOnDevice(platform) {
  if (platform === "android") {
    log("Installing Android APK on connected device...", "yellow");
    const apkPath = path.join(CONFIG.android.outputDir, CONFIG.android.apkName);

    try {
      execCommand(`adb install -r "${apkPath}"`);
      log("Android app installed successfully!", "green");
    } catch (error) {
      log(
        "Error installing APK. Make sure a device is connected and USB debugging is enabled.",
        "red"
      );
    }
  } else if (platform === "ios") {
    log("For iOS device installation, use: npx expo run:ios --device", "blue");
  }
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || "all";
  const install = args.includes("--install");

  log("🚀 Starting development build...", "bright");

  checkPrerequisites();

  if (platform === "all" || platform === "android") {
    buildAndroid();
    if (install) {
      installOnDevice("android");
    }
  }

  if (platform === "all" || platform === "ios") {
    buildiOS();
    if (install) {
      installOnDevice("ios");
    }
  }

  log("✅ Development build completed!", "green");
  log("Next steps:", "blue");
  log("- Android: APK is ready for installation", "blue");
  log('- iOS: Use "npx expo run:ios" to run on simulator', "blue");
}

if (require.main === module) {
  main();
}

module.exports = { buildAndroid, buildiOS, checkPrerequisites };
