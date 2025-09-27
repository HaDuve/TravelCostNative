#!/usr/bin/env node

/**
 * Version Manager Script
 *
 * Helps manage version numbers for both EAS Build and manual builds
 * Use this to sync version numbers when switching between build methods
 */

const fs = require("fs");
const { execSync } = require("child_process");

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

function getCurrentVersions() {
  const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));
  return {
    version: appJson.expo.version,
    iosBuildNumber: appJson.expo.ios.buildNumber,
    androidVersionCode: appJson.expo.android.versionCode,
  };
}

function updateVersions(iosBuildNumber, androidVersionCode) {
  const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));

  appJson.expo.ios.buildNumber = iosBuildNumber;
  appJson.expo.android.versionCode = androidVersionCode;

  fs.writeFileSync("./app.json", JSON.stringify(appJson, null, 2));

  log(`Updated iOS build number to: ${iosBuildNumber}`, "green");
  log(`Updated Android version code to: ${androidVersionCode}`, "green");
}

function getLatestEASBuildNumbers() {
  try {
    log("Fetching latest EAS build numbers...", "yellow");
    const output = execSync("eas build:list --limit 1 --json", {
      stdio: "pipe",
      encoding: "utf8",
    });

    const builds = JSON.parse(output);
    if (builds.length > 0) {
      const latestBuild = builds[0];
      return {
        iosBuildNumber: latestBuild.buildNumber || "1.0.0",
        androidVersionCode: latestBuild.versionCode || 1,
      };
    }
  } catch (error) {
    log(
      "Could not fetch EAS build numbers. Using current app.json values.",
      "yellow"
    );
  }

  return null;
}

function incrementVersions(currentVersions) {
  // Increment iOS build number (format: 1.0.1216)
  const buildNumberParts = currentVersions.iosBuildNumber.split(".");
  const lastPart = parseInt(buildNumberParts[2]) + 1;
  const newIosBuildNumber = `${buildNumberParts[0]}.${buildNumberParts[1]}.${lastPart}`;

  // Increment Android version code
  const newAndroidVersionCode = currentVersions.androidVersionCode + 1;

  return {
    iosBuildNumber: newIosBuildNumber,
    androidVersionCode: newAndroidVersionCode,
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  log("🔢 Version Manager", "bright");

  const currentVersions = getCurrentVersions();
  log(`Current versions:`, "blue");
  log(`  Version: ${currentVersions.version}`, "blue");
  log(`  iOS Build Number: ${currentVersions.iosBuildNumber}`, "blue");
  log(`  Android Version Code: ${currentVersions.androidVersionCode}`, "blue");

  switch (command) {
    case "increment":
      log("\n📈 Incrementing version numbers...", "yellow");
      const newVersions = incrementVersions(currentVersions);
      updateVersions(
        newVersions.iosBuildNumber,
        newVersions.androidVersionCode
      );
      break;

    case "sync-eas":
      log("\n🔄 Syncing with latest EAS build numbers...", "yellow");
      const easVersions = getLatestEASBuildNumbers();
      if (easVersions) {
        // Increment from EAS numbers to avoid conflicts
        const incrementedVersions = incrementVersions(easVersions);
        updateVersions(
          incrementedVersions.iosBuildNumber,
          incrementedVersions.androidVersionCode
        );
      } else {
        log(
          "Could not fetch EAS versions. Incrementing current versions instead.",
          "yellow"
        );
        const newVersions = incrementVersions(currentVersions);
        updateVersions(
          newVersions.iosBuildNumber,
          newVersions.androidVersionCode
        );
      }
      break;

    case "set":
      const iosBuildNumber = args[1];
      const androidVersionCode = parseInt(args[2]);

      if (!iosBuildNumber || !androidVersionCode) {
        log(
          "Usage: node scripts/version-manager.js set <ios-build-number> <android-version-code>",
          "red"
        );
        log(
          "Example: node scripts/version-manager.js set 1.0.1220 101125",
          "blue"
        );
        process.exit(1);
      }

      log(`\n🎯 Setting specific version numbers...`, "yellow");
      updateVersions(iosBuildNumber, androidVersionCode);
      break;

    default:
      log("\n📖 Usage:", "blue");
      log(
        "  node scripts/version-manager.js increment     - Increment current versions",
        "blue"
      );
      log(
        "  node scripts/version-manager.js sync-eas      - Sync with latest EAS build numbers",
        "blue"
      );
      log(
        "  node scripts/version-manager.js set <ios> <android> - Set specific versions",
        "blue"
      );
      log("\n💡 Recommendations:", "yellow");
      log(
        "  - Use 'sync-eas' before running EAS builds to avoid conflicts",
        "yellow"
      );
      log("  - Use 'increment' for manual builds", "yellow");
      log(
        "  - Always use EAS Build for production (eas build --platform all --profile production)",
        "yellow"
      );
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentVersions, updateVersions, incrementVersions };
