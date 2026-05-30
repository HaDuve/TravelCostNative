const VERSION_PARSE_RE = /^(\d+)\.(\d+)\.(\d+)([a-z]*)$/i;

function parseEasUpdateArgs(argv) {
  const opts = {
    target: null,
    message: null,
    bumpChangelog: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") opts.target = argv[++i];
    else if (arg === "--message") opts.message = argv[++i];
    else if (arg === "--bump-changelog") opts.bumpChangelog = true;
    else if (arg === "--dry-run") opts.dryRun = true;
  }

  if (!opts.message) {
    const extras = argv.filter((a) => !a.startsWith("--") && a !== opts.target);
    if (extras.length > 0) {
      opts.message = extras.join(" ").trim();
    }
  }

  return opts;
}

function readMessageFromChangelogSource(source) {
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

function resolveUpdateMessage(opts, context) {
  if (opts.message) return opts.message;
  if (opts.bumpChangelog) return context.defaultNote;
  return context.changelogMessage;
}

function formatBumpRecoveryCommand(message) {
  const escaped = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `pnpm version:bump:eas -- --notes "${escaped}"`;
}

module.exports = {
  parseEasUpdateArgs,
  readMessageFromChangelogSource,
  resolveUpdateMessage,
  formatBumpRecoveryCommand,
};
