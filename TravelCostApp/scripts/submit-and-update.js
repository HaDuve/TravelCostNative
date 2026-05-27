#!/usr/bin/env node
/**
 * Submit latest build to store, then publish an EAS Update to the same audience.
 *
 * Usage examples:
 *   pnpm run submit+update:production:ios -- "Release 1.3.006"
 *   pnpm run submit+update:production:android -- "Release 1.3.006"
 *   pnpm run submit+update:alpha:ios -- "Alpha build + OTA fixes"
 */

const { spawnSync } = require("child_process");

function usageAndExit(message) {
  if (message) console.error(message);
  console.error(
    [
      "Usage:",
      '  node scripts/submit-and-update.js --platform <ios|android> --profile <profile> --branch <branch> --message "<text>"',
      "",
      "Example:",
      '  node scripts/submit-and-update.js --platform ios --profile production --branch production --message "Release 1.3.006"',
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { platform: null, profile: null, branch: null, message: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--platform") opts.platform = argv[++i];
    else if (arg === "--profile") opts.profile = argv[++i];
    else if (arg === "--branch") opts.branch = argv[++i];
    else if (arg === "--message") opts.message = argv[++i];
  }
  if (!opts.message) {
    // Allow passing message as trailing args when invoked via pnpm script:
    // pnpm run submit+update:production:ios -- "My message"
    const tail = argv.filter((a) => !a.startsWith("--"));
    const maybeMessage = tail.slice(1).join(" ").trim(); // skip platform/profile/branch values
    if (maybeMessage) opts.message = maybeMessage;
  }
  return opts;
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.platform || !opts.profile || !opts.branch || !opts.message) {
    usageAndExit("Missing required args.");
  }
  if (opts.platform !== "ios" && opts.platform !== "android") {
    usageAndExit(`Invalid --platform "${opts.platform}" (expected ios|android)`);
  }

  run("eas", [
    "submit",
    "--platform",
    opts.platform,
    "--profile",
    opts.profile,
    "--latest",
    "--non-interactive",
  ]);

  run("eas", ["update", "--branch", opts.branch, "--message", opts.message]);
}

main();

