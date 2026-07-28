import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const appRoot = join(__dirname, "../..");

const LEGACY_IMPORT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "GradientButton",
    pattern: /from\s+["'][^"']*\/GradientButton["']/,
  },
  {
    name: "FlatButton",
    pattern: /from\s+["'][^"']*\/FlatButton["']/,
  },
  {
    name: "Button",
    pattern: /from\s+["'][^"']*(?:\/UI\/Button|\.\/Button)["']/,
  },
];

const ALLOWED_LEGACY_IMPORT_SUFFIXES = [
  "__tests__/",
  "components/UI/GradientButton.tsx",
  "components/UI/FlatButton.tsx",
  "components/UI/Button.tsx",
];

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === "__tests__") continue;
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function isAllowedLegacyImport(relPath: string): boolean {
  return ALLOWED_LEGACY_IMPORT_SUFFIXES.some((allowed) =>
    relPath.includes(allowed)
  );
}

describe("legacy button deprecation", () => {
  it("keeps deprecated button components out of production imports", () => {
    const offenders: string[] = [];

    for (const file of walkSourceFiles(appRoot)) {
      const rel = relative(appRoot, file);
      if (isAllowedLegacyImport(rel)) continue;

      const src = readFileSync(file, "utf8");
      for (const { name, pattern } of LEGACY_IMPORT_PATTERNS) {
        if (pattern.test(src)) {
          offenders.push(`${rel} (${name})`);
          break;
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it.each([
    "components/UI/GradientButton.tsx",
    "components/UI/FlatButton.tsx",
    "components/UI/Button.tsx",
  ])("marks %s @deprecated with ActionRow migration note", (relPath) => {
    const src = readFileSync(join(appRoot, relPath), "utf8");
    expect(src).toMatch(/@deprecated[\s\S]*ActionRow/);
  });
});
