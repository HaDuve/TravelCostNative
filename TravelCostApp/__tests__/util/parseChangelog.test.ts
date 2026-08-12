import {
  parseChangelog,
  parseChangelogBulletLines,
} from "../../util/parseChangelog";

describe("parseChangelogBulletLines", () => {
  it("merges indented continuation lines into one bullet", () => {
    expect(
      parseChangelogBulletLines([
        "- Improved Ask AI on Profile with optional country, currency,",
        "  and date range",
        "- Bugfixes and performance improvements",
      ]),
    ).toEqual([
      "\n\n• Improved Ask AI on Profile with optional country, currency,\n  and date range",
      "\n\n• Bugfixes and performance improvements",
    ]);
  });

  it("treats non-indented lines without a dash as their own bullet", () => {
    expect(parseChangelogBulletLines(["orphan line"])).toEqual([
      "\n\n• Orphan line",
    ]);
  });
});

describe("parseChangelog", () => {
  it("parses a version block with wrapped bullets", () => {
    const source = `1.3.005l
- Improved Ask AI local price on Profile with optional country, currency,
  and date range
- Bugfixes and performance improvements`;

    expect(parseChangelog(source)).toEqual([
      {
        versionString: "1.3.005l",
        changes: [
          "\n\n• Improved Ask AI local price on Profile with optional country, currency,\n  and date range",
          "\n\n• Bugfixes and performance improvements",
        ],
      },
    ]);
  });
});
