#!/usr/bin/env node

/**
 * Production Submit Script
 *
 * Submits production builds to app stores
 * - Android: Uploads AAB to Google Play Console
 * - iOS: Uploads IPA to App Store Connect
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

// Configuration
const CONFIG = {
  android: {
    aabPath: "./android/app/build/outputs/bundle/release/app-release.aab",
    serviceAccountKey:
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY ||
      "/Users/hiono/Documents/Keys/Budget_For_Nomads/EAS/Google_Play_Console/budget-for-nomads-468110-5964d3e3e268.json",
    packageName: "com.budgetfornomads.app",
    track: "production",
  },
  ios: {
    ipaPath: "./ios/build/export/Budget.ipa",
    appleId: "hionoe@hotmail.de",
    ascAppId: "6446042796",
    appleTeamId: "AK62F8767Z",
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

function checkPrerequisites() {
  log("Checking submission prerequisites...", "yellow");

  // Check if required tools are installed
  try {
    execSync("which fastlane", { stdio: "pipe" });
  } catch (error) {
    log("Fastlane not found. Installing...", "yellow");
    execCommand("gem install fastlane");
  }

  // Check if Google Play service account key exists
  if (!fs.existsSync(CONFIG.android.serviceAccountKey)) {
    log(
      `Google Play service account key not found at: ${CONFIG.android.serviceAccountKey}`,
      "red"
    );
    log(
      "Please ensure the service account key file exists and is accessible",
      "yellow"
    );
    process.exit(1);
  }

  log("Prerequisites check passed!", "green");
}

function submitAndroid() {
  log("Submitting Android app to Google Play Console...", "yellow");

  // Check if AAB exists
  if (!fs.existsSync(CONFIG.android.aabPath)) {
    log(`AAB not found at: ${CONFIG.android.aabPath}`, "red");
    log('Please run "npm run build:prod android" first', "yellow");
    process.exit(1);
  }

  // Create Fastfile for Android submission
  const fastfilePath = "./fastlane/Android/Fastfile";
  const fastfileDir = path.dirname(fastfilePath);

  if (!fs.existsSync(fastfileDir)) {
    execCommand(`mkdir -p ${fastfileDir}`);
  }

  const fastfileContent = `default_platform(:android)

platform :android do
  desc "Deploy a new version to the Google Play"
  lane :deploy do
    upload_to_play_store(
      track: '${CONFIG.android.track}',
      json_key: '${CONFIG.android.serviceAccountKey}',
      aab: '${CONFIG.android.aabPath}',
      skip_upload_apk: true,
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end`;

  fs.writeFileSync(fastfilePath, fastfileContent);

  // Run Fastlane
  execCommand(`cd fastlane && fastlane android deploy`);

  log("Android app submitted successfully!", "green");
}

function checkiOSSubmissionPrerequisites() {
  log("Checking iOS submission prerequisites...", "yellow");

  // Check if we're on macOS
  if (process.platform !== "darwin") {
    log("Error: iOS submission can only be performed on macOS", "red");
    process.exit(1);
  }

  // Check if IPA exists
  if (!fs.existsSync(CONFIG.ios.ipaPath)) {
    log(`IPA not found at: ${CONFIG.ios.ipaPath}`, "red");
    log('Please run "npm run build:prod ios" first', "yellow");
    process.exit(1);
  }

  // Check IPA size
  const ipaSize = fs.statSync(CONFIG.ios.ipaPath).size / 1024 / 1024;
  log(`IPA size: ${ipaSize.toFixed(2)} MB`, "blue");

  if (ipaSize > 100) {
    log(
      "Warning: IPA size is large (>100MB). This may cause upload issues.",
      "yellow"
    );
  }

  log("iOS submission prerequisites check passed!", "green");
}

function submitiOS() {
  log("Submitting iOS app to App Store Connect...", "yellow");

  checkiOSSubmissionPrerequisites();

  // Create Fastfile for iOS submission
  const fastfilePath = "./fastlane/iOS/Fastfile";
  const fastfileDir = path.dirname(fastfilePath);

  if (!fs.existsSync(fastfileDir)) {
    execCommand(`mkdir -p ${fastfileDir}`);
  }

  const fastfileContent = `default_platform(:ios)

platform :ios do
  desc "Deploy a new version to the App Store"
  lane :deploy do
    # Validate the IPA first
    validate_app(
      ipa: '${CONFIG.ios.ipaPath}',
      apple_id: '${CONFIG.ios.appleId}'
    )

    # Upload to App Store
    upload_to_app_store(
      ipa: '${CONFIG.ios.ipaPath}',
      apple_id: '${CONFIG.ios.appleId}',
      app_identifier: 'com.budgetfornomads.app',
      skip_binary_upload: false,
      skip_screenshots: true,
      skip_metadata: true,
      force: true,
      submit_for_review: false
    )
  end
end`;

  fs.writeFileSync(fastfilePath, fastfileContent);
  log("Fastfile created for iOS submission", "green");

  try {
    // Run Fastlane
    execCommand(`cd fastlane && fastlane ios deploy`);
    log("iOS app submitted successfully!", "green");
    log("Check App Store Connect for submission status", "blue");
  } catch (error) {
    log("iOS submission failed. Common solutions:", "red");
    log("1. Check Apple ID credentials", "yellow");
    log("2. Verify app identifier matches App Store Connect", "yellow");
    log("3. Check if app version is already uploaded", "yellow");
    log("4. Ensure valid provisioning profiles", "yellow");
    process.exit(1);
  }
}

function createFastlaneConfig() {
  log("Creating Fastlane configuration...", "yellow");

  // Create Appfile
  const appfileContent = `app_identifier("com.budgetfornomads.app")
apple_id("${CONFIG.ios.appleId}")
team_id("${CONFIG.ios.appleTeamId}")`;

  fs.writeFileSync("./fastlane/Appfile", appfileContent);

  // Create Gemfile
  const gemfileContent = `source "https://rubygems.org"

gem "fastlane"
gem "cocoapods"`;

  fs.writeFileSync("./fastlane/Gemfile", gemfileContent);

  log("Fastlane configuration created!", "green");
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || "all";

  log("📤 Starting production submission...", "bright");

  checkPrerequisites();
  createFastlaneConfig();

  if (platform === "all" || platform === "android") {
    submitAndroid();
  }

  if (platform === "all" || platform === "ios") {
    submitiOS();
  }

  log("✅ Production submission completed!", "green");
  log("Check your app store consoles for submission status", "blue");
}

if (require.main === module) {
  main();
}

module.exports = { submitAndroid, submitiOS, checkPrerequisites };
