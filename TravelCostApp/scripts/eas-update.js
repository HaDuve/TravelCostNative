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
 *   node scripts/eas-update.js --target production --bump-changelog --dry-run
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { getUpdateTarget } = require("./eas-profiles");
const { bumpEasUpdate, DEFAULT_NOTES } = require("./bump-app-version");
const {
  parseEasUpdateArgs,
  readMessageFromChangelogSource,
  resolveUpdateMessage,
  formatBumpRecoveryCommand,
} = require("./eas-update-message");

const ROOT = path.join(__dirname, "..");
const CHANGELOG = path.join(ROOT, "changelog.txt");

function usageAndExit(message) {
  if (message) console.error(message);
  console.error(
    [
      "Usage:",
      "  node scripts/eas-update.js --target <production|alpha|staging|dev> [--message <text>] [--bump-changelog] [--dry-run]",
      "",
      "Examples:",
      '  pnpm run update:production -- "Fix login"',
      "  pnpm run update:production:bump",
      "  node scripts/eas-update.js --target production --bump-changelog --dry-run",
    ].join("\n"),
  );
  process.exit(1);
}

function readDefaultMessageFromChangelog() {
  const source = fs.readFileSync(CHANGELOG, "utf8");
  return readMessageFromChangelogSource(source);
}

function runUpdate(target, message, dryRun) {
  let config;
  try {
    config = getUpdateTarget(target);
  } catch (err) {
    usageAndExit(err.message);
  }

  console.log(
    `Publishing EAS update → branch ${config.branch}, environment ${config.environment}`,
  );
  console.log(`Message: ${message}`);

  if (dryRun) {
    console.log("Dry run — skipping eas update publish.");
    return;
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

  const res = spawnSync("eas", args, { stdio: "inherit", cwd: ROOT });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) {
    process.exit(res.status);
  }
}

function runChangelogBump(message, dryRun) {
  try {
    bumpEasUpdate({ notes: [message], dryRun });
  } catch (err) {
    console.error(
      dryRun
        ? "\nDry run changelog bump failed:"
        : "\nEAS update published but changelog bump failed:",
    );
    console.error(err instanceof Error ? err.message : String(err));
    if (!dryRun) {
      console.error(`Recovery: ${formatBumpRecoveryCommand(message)}`);
    }
    process.exit(1);
  }
}

function main() {
  const opts = parseEasUpdateArgs(process.argv.slice(2));
  if (!opts.target) {
    usageAndExit("Missing --target.");
  }

  const message = resolveUpdateMessage(opts, {
    defaultNote: DEFAULT_NOTES[0],
    changelogMessage: readDefaultMessageFromChangelog(),
  });
  if (!message) {
    usageAndExit("Missing update message. Pass --message or add a __Newest Changes__ block in changelog.txt.");
  }

  runUpdate(opts.target, message, opts.dryRun);

  if (opts.bumpChangelog) {
    runChangelogBump(message, opts.dryRun);
  }
}

main();
