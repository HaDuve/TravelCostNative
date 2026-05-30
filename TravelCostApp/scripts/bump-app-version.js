#!/usr/bin/env node
/**
 * Bump Expo app version in app.config.js, app.json, and changelog.txt.
 *
 * Usage:
 *   pnpm version:bump
 *   pnpm version:bump -- --notes "Fixed sync" "Improved splits"
 *   pnpm version:bump -- --dry-run
 *   pnpm version:bump -- --eas
 *   pnpm version:bump -- --eas --notes "Fixed chart zoom"
 *   pnpm version:bump -- --eas --dry-run
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const APP_CONFIG = path.join(ROOT, "app.config.js");
const APP_JSON = path.join(ROOT, "app.json");
const CHANGELOG = path.join(ROOT, "changelog.txt");

const VERSION_RE = /version:\s*["']([^"']+)["']/;
const VERSION_PARSE_RE = /^(\d+)\.(\d+)\.(\d+)([a-z]*)$/i;
const DEFAULT_NOTES = ["Bugfixes and performance improvements"];

function parseArgs(argv) {
  const options = { dryRun: false, eas: false, notes: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--eas") {
      options.eas = true;
    } else if (arg === "--notes") {
      i += 1;
      while (i < argv.length && !argv[i].startsWith("--")) {
        options.notes.push(argv[i]);
        i += 1;
      }
      i -= 1;
    }
  }
  if (options.notes.length === 0) {
    options.notes = DEFAULT_NOTES;
  }
  return options;
}

function parseVersion(version) {
  const match = version.match(VERSION_PARSE_RE);
  if (!match) {
    throw new Error(`Unrecognized version format: ${version}`);
  }
  const [, major, minor, patch, suffix] = match;
  const base = `${major}.${minor}.${patch}`;
  return { major, minor, patch, suffix, base };
}

function readCurrentVersion() {
  const source = fs.readFileSync(APP_CONFIG, "utf8");
  const match = source.match(VERSION_RE);
  if (!match) {
    throw new Error(`Could not find version in ${APP_CONFIG}`);
  }
  return match[1];
}

function bumpAppVersion(version) {
  const { major, minor, patch, suffix } = parseVersion(version);
  if (suffix) {
    throw new Error(
      `Version "${version}" has a letter suffix; use --eas for OTA changelog bumps or fix app.config.js manually`,
    );
  }
  const nextPatch = String(Number(patch) + 1).padStart(patch.length, "0");
  return `${major}.${minor}.${nextPatch}`;
}

function bumpEasSuffix(version) {
  const { base, suffix } = parseVersion(version);
  if (!suffix) {
    return `${base}a`;
  }
  if (suffix.length !== 1) {
    throw new Error(
      `Multi-character EAS suffix "${suffix}" is not supported; bump the app version instead`,
    );
  }
  if (suffix.toLowerCase() === "z") {
    throw new Error(
      `EAS suffix exhausted for ${base}; bump the app version with pnpm version:bump`,
    );
  }
  const nextChar = String.fromCharCode(suffix.charCodeAt(0) + 1);
  return `${base}${nextChar}`;
}

function readNewestChangelogVersion() {
  const source = fs.readFileSync(CHANGELOG, "utf8");
  const newestMarker = "__Newest Changes:";
  const otherMarker = "__Other Changes:";
  const newestIdx = source.indexOf(newestMarker);
  const otherIdx = source.indexOf(otherMarker);
  if (newestIdx === -1 || otherIdx === -1 || otherIdx <= newestIdx) {
    throw new Error("changelog.txt is missing expected section markers");
  }

  const newestBody = source
    .slice(newestIdx + newestMarker.length, otherIdx)
    .trim();
  const firstLine = newestBody.split("\n")[0]?.trim() ?? "";
  if (!VERSION_PARSE_RE.test(firstLine)) {
    throw new Error(
      `Could not parse version from changelog newest block: "${firstLine}"`,
    );
  }
  return firstLine;
}

function replaceVersionInSource(source, pattern, next, label) {
  const updated = source.replace(pattern, `$1${next}$2`);
  if (updated === source) {
    throw new Error(`Version not found in ${label}`);
  }
  return updated;
}

function replaceVersionInFile(filePath, current, next) {
  const source = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(
    `(version:\\s*["'])${escapeRegExp(current)}(["'])`,
    "g",
  );
  const updated = replaceVersionInSource(source, pattern, next, filePath);
  fs.writeFileSync(filePath, updated);
}

function replaceVersionInAppJson(current, next) {
  const source = fs.readFileSync(APP_JSON, "utf8");
  const pattern = new RegExp(
    `("version":\\s*")${escapeRegExp(current)}(")`,
    "g",
  );
  const updated = replaceVersionInSource(source, pattern, next, APP_JSON);
  fs.writeFileSync(APP_JSON, updated);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatChangelogBlock(version, notes) {
  const bullets = notes.map((note) => `- ${note}`).join("\n");
  return `${version}\n${bullets}`;
}

function updateChangelog(next, notes) {
  const source = fs.readFileSync(CHANGELOG, "utf8");
  const newestMarker = "__Newest Changes:";
  const otherMarker = "__Other Changes:";
  const newestIdx = source.indexOf(newestMarker);
  const otherIdx = source.indexOf(otherMarker);
  if (newestIdx === -1 || otherIdx === -1 || otherIdx <= newestIdx) {
    throw new Error(`changelog.txt is missing expected section markers`);
  }

  const newestBody = source
    .slice(newestIdx + newestMarker.length, otherIdx)
    .trim();
  const restAfterOther = source.slice(otherIdx + otherMarker.length).trimStart();

  const previousNewest = newestBody || null;
  const newBlock = formatChangelogBlock(next, notes);
  const movedPrevious = previousNewest
    ? `${previousNewest}\n\n${restAfterOther}`
    : restAfterOther;

  const updated = [
    "Changelog Travel Expense App",
    "",
    newestMarker,
    "",
    newBlock,
    "",
    otherMarker,
    "",
    movedPrevious,
  ].join("\n");

  fs.writeFileSync(CHANGELOG, updated.endsWith("\n") ? updated : `${updated}\n`);
}

function bumpEasUpdate(options) {
  const appVersion = readCurrentVersion();
  const { suffix: appSuffix, base: appBase } = parseVersion(appVersion);
  if (appSuffix) {
    throw new Error(
      `app.config.js version must not include an EAS suffix: ${appVersion}`,
    );
  }

  const changelogVersion = readNewestChangelogVersion();
  const { base: changelogBase } = parseVersion(changelogVersion);
  if (changelogBase !== appBase) {
    throw new Error(
      `Changelog newest (${changelogVersion}) does not match app version ${appVersion}`,
    );
  }

  const next = bumpEasSuffix(changelogVersion);
  console.log(`EAS changelog: ${changelogVersion} → ${next} (app version stays ${appVersion})`);

  if (options.dryRun) {
    console.log("Dry run — no files written.");
    console.log("Changelog notes:");
    for (const note of options.notes) {
      console.log(`  - ${note}`);
    }
    return;
  }

  updateChangelog(next, options.notes);
  console.log("Updated changelog.txt (app.config.js and app.json unchanged)");
}

function bumpAppRelease(options) {
  const current = readCurrentVersion();
  const next = bumpAppVersion(current);

  console.log(`App version: ${current} → ${next}`);
  if (options.dryRun) {
    console.log("Dry run — no files written.");
    console.log("Changelog notes:");
    for (const note of options.notes) {
      console.log(`  - ${note}`);
    }
    return;
  }

  replaceVersionInFile(APP_CONFIG, current, next);
  replaceVersionInAppJson(current, next);
  updateChangelog(next, options.notes);

  console.log("Updated app.config.js, app.json, and changelog.txt");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.eas) {
    bumpEasUpdate(options);
    return;
  }
  bumpAppRelease(options);
}

if (require.main === module) {
  main();
}

module.exports = { bumpEasUpdate, DEFAULT_NOTES };
