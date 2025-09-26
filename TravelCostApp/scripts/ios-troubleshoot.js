#!/usr/bin/env node

/**
 * iOS Build Troubleshooting Script
 *
 * Helps diagnose and fix common iOS build issues
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
    return null;
  }
}

function checkXcodeInstallation() {
  log("Checking Xcode installation...", "yellow");

  try {
    const version = execSync("xcodebuild -version", {
      stdio: "pipe",
      encoding: "utf8",
    });
    log(`✓ Xcode version: ${version.split("\n")[0]}`, "green");
    return true;
  } catch (error) {
    log("✗ Xcode not found. Please install Xcode from the App Store.", "red");
    return false;
  }
}

function checkCommandLineTools() {
  log("Checking Xcode Command Line Tools...", "yellow");

  try {
    execSync("xcode-select -p", { stdio: "pipe" });
    log("✓ Command Line Tools installed", "green");
    return true;
  } catch (error) {
    log("✗ Command Line Tools not found. Installing...", "yellow");
    execCommand("xcode-select --install");
    return false;
  }
}

function checkCocoaPods() {
  log("Checking CocoaPods installation...", "yellow");

  try {
    const version = execSync("pod --version", {
      stdio: "pipe",
      encoding: "utf8",
    });
    log(`✓ CocoaPods version: ${version.trim()}`, "green");
    return true;
  } catch (error) {
    log("✗ CocoaPods not found. Installing...", "yellow");
    execCommand("gem install cocoapods");
    return false;
  }
}

function checkSimulators() {
  log("Checking available iOS simulators...", "yellow");

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

    if (availableSims.length > 0) {
      log(`✓ Found ${availableSims.length} available simulators:`, "green");
      availableSims.forEach((sim) => {
        log(`  - ${sim.name} (${sim.runtime})`, "blue");
      });
      return true;
    } else {
      log("✗ No available simulators found", "red");
      return false;
    }
  } catch (error) {
    log("✗ Could not check simulators", "red");
    return false;
  }
}

function checkProjectStructure() {
  log("Checking iOS project structure...", "yellow");

  const requiredFiles = [
    "./ios/Budget.xcworkspace",
    "./ios/Podfile",
    "./ios/Budget.xcodeproj",
    "./app.json",
  ];

  let allFilesExist = true;
  requiredFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      log(`✓ ${file}`, "green");
    } else {
      log(`✗ ${file} missing`, "red");
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

function checkConfigurationConsistency() {
  log("Checking configuration consistency...", "yellow");

  try {
    const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));
    const podfileProps = JSON.parse(
      fs.readFileSync("./ios/Podfile.properties.json", "utf8")
    );

    const appNewArch = appJson.expo.newArchEnabled;
    const podNewArch = podfileProps.newArchEnabled === "true";

    if (appNewArch === podNewArch) {
      log(`✓ New Architecture setting consistent: ${appNewArch}`, "green");
    } else {
      log(
        `✗ New Architecture mismatch: app.json=${appNewArch}, Podfile.properties.json=${podNewArch}`,
        "red"
      );
      log("  Fix: Update Podfile.properties.json to match app.json", "yellow");
      return false;
    }

    return true;
  } catch (error) {
    log("✗ Could not check configuration files", "red");
    return false;
  }
}

function cleanProject() {
  log("Cleaning iOS project...", "yellow");

  const cleanCommands = [
    "cd ios && rm -rf build",
    "cd ios && rm -rf Pods",
    "cd ios && rm -f Podfile.lock",
    "cd ios && xcodebuild clean -workspace Budget.xcworkspace -scheme Budget",
    "rm -rf node_modules",
    "rm -f pnpm-lock.yaml",
  ];

  cleanCommands.forEach((cmd) => {
    execCommand(cmd);
  });

  log("✓ Project cleaned", "green");
}

function reinstallDependencies() {
  log("Reinstalling dependencies...", "yellow");

  execCommand("pnpm install");
  execCommand(
    "cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update"
  );

  log("✓ Dependencies reinstalled", "green");
}

function main() {
  log("🔧 iOS Build Troubleshooting Tool", "bright");
  log("=====================================", "bright");

  const checks = [
    { name: "Xcode Installation", fn: checkXcodeInstallation },
    { name: "Command Line Tools", fn: checkCommandLineTools },
    { name: "CocoaPods", fn: checkCocoaPods },
    { name: "iOS Simulators", fn: checkSimulators },
    { name: "Project Structure", fn: checkProjectStructure },
    { name: "Configuration Consistency", fn: checkConfigurationConsistency },
  ];

  const results = checks.map((check) => ({
    name: check.name,
    passed: check.fn(),
  }));

  const failedChecks = results.filter((r) => !r.passed);

  if (failedChecks.length === 0) {
    log(
      "\n✅ All checks passed! Your iOS build environment looks good.",
      "green"
    );
  } else {
    log(`\n❌ ${failedChecks.length} check(s) failed:`, "red");
    failedChecks.forEach((check) => {
      log(`  - ${check.name}`, "red");
    });

    log("\n🔧 Suggested fixes:", "yellow");
    log("1. Run: node scripts/ios-troubleshoot.js --clean", "blue");
    log("2. Run: node scripts/ios-troubleshoot.js --reinstall", "blue");
    log("3. Check Xcode and Command Line Tools installation", "blue");
  }

  const args = process.argv.slice(2);

  if (args.includes("--clean")) {
    log("\n🧹 Cleaning project...", "yellow");
    cleanProject();
  }

  if (args.includes("--reinstall")) {
    log("\n📦 Reinstalling dependencies...", "yellow");
    reinstallDependencies();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkXcodeInstallation,
  checkCommandLineTools,
  checkCocoaPods,
  checkSimulators,
  checkProjectStructure,
  checkConfigurationConsistency,
  cleanProject,
  reinstallDependencies,
};
