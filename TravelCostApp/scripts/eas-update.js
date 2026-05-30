#!/usr/bin/env node
/**
 * Publish an EAS Update with branch + environment aligned to eas.json build profiles.
 *
 * Usage:
 *   pnpm run update:production -- "Fix login"
 *   pnpm run update:production:bump -- "Fix login"
 *   node scripts/eas-update.js --target production --message "Fix login"
 *   node scripts/eas-update.js --target production   # message from changelog newest block
 *   node scripts/eas-update.js --target production --bump-changelog [--message "Fix login"]
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { getUpdateTarget } = require("./eas-profiles");
const { bumpEasUpdate, DEFAULT_NOTES } = require("./bump-app-version");

const ROOT = path.join(__dirname, "..");
const CHANGELOG = path.join(ROOT, "changelog.txt");

const VERSION_PARSE_RE = /^(\d+)\.(\d+)\.(\d+)([a-z]*)$/i;

function usageAndExit(message) {
  if (message) console.error(message);
  console.error(
    [
      "Usage:",
      "  node scripts/eas-update.js --target <production|alpha|staging|dev> [--message <text>] [--bump-changelog]",
      "",
      "Examples:",
      '  pnpm run update:production -- "Fix login"',
      "  pnpm run update:production:bump",
      "  node scripts/eas-update.js --target production",
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { target: null, message: null, bumpChangelog: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") opts.target = argv[++i];
    else if (arg === "--message") opts.message = argv[++i];
    else if (arg === "--bump-changelog") opts.bumpChangelog = true;
  }

  if (!opts.message) {
    const extras = argv.filter((a) => !a.startsWith("--") && a !== opts.target);
    if (extras.length > 0) {
      opts.message = extras.join(" ").trim();
    }
  }

  return opts;
}

function readDefaultMessageFromChangelog() {
  const source = fs.readFileSync(CHANGELOG, "utf8");
  const newestMarker = "__Newest Changes:";
  const otherMarker = "__Other Changes:";
  const newestIdx = source.indexOf(newestMarker);
  const otherIdx = source.indexOf(otherMarker);
  if (newestIdx === -1 || otherIdx === -1 || otherIdx <= newestIdx) {
    return null;
  }

  const newestBody = source
    .slice(newestIdx + newestMarker.length, otherIdx)
    .trim();
  const lines = newestBody.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const version = lines[0];
  if (!VERSION_PARSE_RE.test(version)) {
    return lines.join(" ");
  }

  const firstBullet = lines.find((line) => line.startsWith("- "));
  if (firstBullet) {
    return `${version}: ${firstBullet.slice(2)}`;
  }
  return `OTA ${version}`;
}

function runUpdate(target, message) {
  let config;
  try {
    config = getUpdateTarget(target);
  } catch (err) {
    usageAndExit(err.message);
  }

  const args = [
    "update",
    "--branch",
    config.branch,
    "--environment",
    config.environment,
    "--non-interactive",
    "--message",
    message,
  ];

  console.log(
    `Publishing EAS update → branch ${config.branch}, environment ${config.environment}`,
  );
  console.log(`Message: ${message}`);

  const res = spawnSync("eas", args, { stdio: "inherit", cwd: ROOT });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) {
    process.exit(res.status);
  }
}

function resolveUpdateMessage(opts) {
  if (opts.message) return opts.message;
  if (opts.bumpChangelog) return DEFAULT_NOTES[0];
  return readDefaultMessageFromChangelog();
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.target) {
    usageAndExit("Missing --target.");
  }

  const message = resolveUpdateMessage(opts);
  if (!message) {
    usageAndExit("Missing update message. Pass --message or add a __Newest Changes__ block in changelog.txt.");
  }

  runUpdate(opts.target, message);

  if (opts.bumpChangelog) {
    bumpEasUpdate({ notes: [message] });
  }
}

main();
