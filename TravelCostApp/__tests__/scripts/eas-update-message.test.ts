const {
  parseEasUpdateArgs,
  readMessageFromChangelogSource,
  resolveUpdateMessage,
  formatBumpRecoveryCommand,
} = require("../../scripts/eas-update-message");

describe("parseEasUpdateArgs", () => {
  it("parses target, message, bump-changelog, and dry-run flags", () => {
    expect(
      parseEasUpdateArgs([
        "--target",
        "production",
        "--bump-changelog",
        "--dry-run",
        "--message",
        "Fix login",
      ]),
    ).toEqual({
      target: "production",
      message: "Fix login",
      bumpChangelog: true,
      dryRun: true,
    });
  });

  it("accepts a trailing message after flags", () => {
    expect(
      parseEasUpdateArgs(["--target", "production", "--bump-changelog", "Fix login"]),
    ).toEqual({
      target: "production",
      message: "Fix login",
      bumpChangelog: true,
      dryRun: false,
    });
  });
});

describe("readMessageFromChangelogSource", () => {
  it("formats the newest changelog block as version plus first bullet", () => {
    const source = [
      "Changelog Travel Expense App",
      "",
      "__Newest Changes:",
      "",
      "1.3.005c",
      "- Added restore feature after delete expense",
      "",
      "__Other Changes:",
      "",
      "1.3.005b",
    ].join("\n");

    expect(readMessageFromChangelogSource(source)).toBe(
      "1.3.005c: Added restore feature after delete expense",
    );
  });

  it("returns null when changelog markers are missing", () => {
    expect(readMessageFromChangelogSource("no markers here")).toBeNull();
  });
});

describe("resolveUpdateMessage", () => {
  const context = {
    defaultNote: "Bugfixes and performance improvements",
    changelogMessage: "1.3.005c: Added restore feature after delete expense",
  };

  it("prefers an explicit message over bump defaults and changelog text", () => {
    expect(
      resolveUpdateMessage(
        { message: "Fix login", bumpChangelog: true },
        context,
      ),
    ).toBe("Fix login");
  });

  it("uses the default note when bump-changelog is set without a message", () => {
    expect(
      resolveUpdateMessage({ message: null, bumpChangelog: true }, context),
    ).toBe("Bugfixes and performance improvements");
  });

  it("reads the changelog message when bump-changelog is not set", () => {
    expect(
      resolveUpdateMessage({ message: null, bumpChangelog: false }, context),
    ).toBe("1.3.005c: Added restore feature after delete expense");
  });

  it("returns null when no message source is available", () => {
    expect(
      resolveUpdateMessage(
        { message: null, bumpChangelog: false },
        { defaultNote: "Bugfixes and performance improvements", changelogMessage: null },
      ),
    ).toBeNull();
  });
});

describe("formatBumpRecoveryCommand", () => {
  it("prints a version:bump:eas command with the same note", () => {
    expect(formatBumpRecoveryCommand("Fix login")).toBe(
      'pnpm version:bump:eas -- --notes "Fix login"',
    );
  });

  it("escapes double quotes in recovery notes", () => {
    expect(formatBumpRecoveryCommand('Say "hello"')).toBe(
      'pnpm version:bump:eas -- --notes "Say \\"hello\\""',
    );
  });
});
