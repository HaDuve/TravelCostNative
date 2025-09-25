#!/usr/bin/env node

/**
 * Production Build Script
 *
 * Builds the app for production deployment
 * - Android: Creates AAB (Android App Bundle) for Play Store
 * - iOS: Creates IPA for App Store
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

// Configuration
const CONFIG = {
  android: {
    buildType: "release",
    outputDir: "./android/app/build/outputs/bundle/release",
    aabName: "app-release.aab",
    keystorePath: "./android/app/release.keystore",
    keystoreAlias: "release-key",
  },
  ios: {
    scheme: "Budget",
    configuration: "Release",
    outputDir: "./ios/build",
    archivePath: "./ios/build/Budget.xcarchive",
    exportPath: "./ios/build/export",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
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

function checkEnvironment() {
  log("Checking production build environment...", "yellow");

  // Check environment variables
  const requiredEnvVars = [
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_PASSWORD",
    "ANDROID_KEY_ALIAS",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    log(
      `Missing required environment variables: ${missingVars.join(", ")}`,
      "red"
    );
    log(
      "Please set these variables before running production build:",
      "yellow"
    );
    missingVars.forEach((varName) => {
      log(`  export ${varName}=your_value`, "blue");
    });
    process.exit(1);
  }

  // Check if keystore exists
  if (!fs.existsSync(CONFIG.android.keystorePath)) {
    log(`Android keystore not found at: ${CONFIG.android.keystorePath}`, "red");
    log("Please create a release keystore for production builds", "yellow");
    log(
      "You can generate one with: keytool -genkey -v -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000",
      "blue"
    );
    process.exit(1);
  }

  log("Environment check passed!", "green");
}

function updateVersionNumbers() {
  log("Updating version numbers...", "yellow");

  // Read current package.json
  const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
  const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));

  // Get version from app.json (source of truth)
  const version = appJson.expo.version;
  const buildNumber = appJson.expo.ios.buildNumber;
  const versionCode = appJson.expo.android.versionCode;

  log(`Version: ${version}`, "blue");
  log(`iOS Build Number: ${buildNumber}`, "blue");
  log(`Android Version Code: ${versionCode}`, "blue");
}

function buildAndroid() {
  log("Building Android production app...", "yellow");

  // Clean previous builds
  execCommand("cd android && ./gradlew clean");

  // Build release AAB
  execCommand("cd android && ./gradlew bundleRelease");

  // Check if AAB was created
  const aabPath = path.join(CONFIG.android.outputDir, CONFIG.android.aabName);
  if (fs.existsSync(aabPath)) {
    log(`Android AAB built successfully: ${aabPath}`, "green");
    log(
      `AAB size: ${(fs.statSync(aabPath).size / 1024 / 1024).toFixed(2)} MB`,
      "blue"
    );
  } else {
    log("Error: AAB not found after build", "red");
    process.exit(1);
  }
}

function checkiOSPrerequisites() {
  log("Checking iOS build prerequisites...", "yellow");

  // Check if Xcode is installed
  try {
    const xcodeVersion = execSync("xcodebuild -version", {
      stdio: "pipe",
      encoding: "utf8",
    });
    log(`Xcode version: ${xcodeVersion.split("\n")[0]}`, "blue");
  } catch (error) {
    log(
      "Error: Xcode not found. Please install Xcode from the App Store.",
      "red"
    );
    process.exit(1);
  }

  // Check if we're on macOS
  if (process.platform !== "darwin") {
    log("Error: iOS builds can only be performed on macOS", "red");
    process.exit(1);
  }

  // Check if workspace exists
  if (!fs.existsSync("./ios/Budget.xcworkspace")) {
    log(
      "Error: iOS workspace not found. Please run 'npx expo prebuild' first.",
      "red"
    );
    process.exit(1);
  }

  // Check for code signing configuration
  log("Checking code signing configuration...", "yellow");
  try {
    const result = execSync(
      `cd ios && xcodebuild -workspace Budget.xcworkspace -scheme ${CONFIG.ios.scheme} -configuration ${CONFIG.ios.configuration} -showBuildSettings | grep -E "(DEVELOPMENT_TEAM|CODE_SIGN_IDENTITY)"`,
      { stdio: "pipe", encoding: "utf8" }
    );

    if (
      result.includes("DEVELOPMENT_TEAM") &&
      result.includes("CODE_SIGN_IDENTITY")
    ) {
      log("✓ Code signing configuration found", "green");
    } else {
      log("⚠️  Code signing may not be properly configured", "yellow");
      log(
        "   You may need to configure signing in Xcode before building",
        "yellow"
      );
    }
  } catch (error) {
    log("⚠️  Could not verify code signing configuration", "yellow");
    log(
      "   This is normal if you haven't opened the project in Xcode yet",
      "yellow"
    );
  }

  log("iOS prerequisites check passed!", "green");
}

function createExportOptionsPlist() {
  const exportOptionsPath = "./ios/ExportOptions.plist";

  if (!fs.existsSync(exportOptionsPath)) {
    log("Creating ExportOptions.plist...", "yellow");
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
    <key>destination</key>
    <string>export</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>`;
    fs.writeFileSync(exportOptionsPath, exportOptions);
    log("ExportOptions.plist created successfully", "green");
  } else {
    log("ExportOptions.plist already exists", "blue");
  }
}

function buildiOS() {
  log("Building iOS production app...", "yellow");

  checkiOSPrerequisites();

  // Clean previous builds
  if (fs.existsSync("./ios/build")) {
    log("Cleaning previous iOS builds...", "yellow");
    execCommand("cd ios && rm -rf build");
  }

  // Install pods with repo update
  log("Installing iOS dependencies...", "yellow");
  execCommand(
    "cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update"
  );

  // Create export options plist
  createExportOptionsPlist();

  // Create archive
  log("Creating iOS archive...", "yellow");
  const archiveCommand = `cd ios && xcodebuild -workspace Budget.xcworkspace -scheme ${CONFIG.ios.scheme} -configuration ${CONFIG.ios.configuration} -destination generic/platform=iOS -archivePath "${CONFIG.ios.archivePath}" archive`;

  try {
    execCommand(archiveCommand);
    log("Archive created successfully", "green");
  } catch (error) {
    log(
      "Archive creation failed. This is expected if code signing is not configured.",
      "red"
    );
    log("", "reset");
    log("🔧 To fix code signing issues:", "yellow");
    log("1. Open ios/Budget.xcworkspace in Xcode", "blue");
    log("2. Select the 'Budget' project in the navigator", "blue");
    log("3. Go to 'Signing & Capabilities' tab", "blue");
    log("4. Select your Apple Developer team", "blue");
    log("5. Ensure 'Automatically manage signing' is checked", "blue");
    log("", "reset");
    log("📝 Alternative: Use EAS Build for production:", "yellow");
    log(
      "   eas build --platform ios --profile production --non-interactive",
      "blue"
    );
    log("", "reset");
    log(
      "⚠️  Note: Production builds require valid Apple Developer account and code signing",
      "yellow"
    );
    process.exit(1);
  }

  // Export IPA
  log("Exporting IPA...", "yellow");
  const exportCommand = `cd ios && xcodebuild -exportArchive -archivePath "${CONFIG.ios.archivePath}" -exportPath "${CONFIG.ios.exportPath}" -exportOptionsPlist ExportOptions.plist`;

  try {
    execCommand(exportCommand);
  } catch (error) {
    log("IPA export failed. Common solutions:", "red");
    log("1. Check ExportOptions.plist configuration", "yellow");
    log("2. Verify Apple Developer account settings", "yellow");
    log("3. Check provisioning profiles", "yellow");
    process.exit(1);
  }

  // Check if IPA was created
  const ipaPath = path.join(CONFIG.ios.exportPath, "Budget.ipa");
  if (fs.existsSync(ipaPath)) {
    log(`iOS IPA built successfully: ${ipaPath}`, "green");
    log(
      `IPA size: ${(fs.statSync(ipaPath).size / 1024 / 1024).toFixed(2)} MB`,
      "blue"
    );
  } else {
    log("Error: IPA not found after build", "red");
    log("Check the export logs above for details", "yellow");
    process.exit(1);
  }
}

function createKeystoreConfig() {
  log("Creating Android keystore configuration...", "yellow");

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
  log(
    "Note: Update android/app/build.gradle with the above signing configuration",
    "blue"
  );
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || "all";

  log("🏭 Starting production build...", "bright");

  checkEnvironment();
  updateVersionNumbers();

  if (platform === "all" || platform === "android") {
    buildAndroid();
  }

  if (platform === "all" || platform === "ios") {
    buildiOS();
  }

  log("✅ Production build completed!", "green");
  log("Next steps:", "blue");
  log("- Android: Upload AAB to Google Play Console", "blue");
  log("- iOS: Upload IPA to App Store Connect", "blue");
  log("- Or use: npm run submit:prod", "blue");
}

if (require.main === module) {
  main();
}

module.exports = { buildAndroid, buildiOS, checkEnvironment };
