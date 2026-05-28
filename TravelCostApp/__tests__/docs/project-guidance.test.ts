import { readFileSync } from "fs";
import { join } from "path";

const appRoot = join(__dirname, "../..");

describe("project guidance (issue #220)", () => {
  it("CLAUDE.md links to CONTEXT.md and instructs use of domain terms", () => {
    const claude = readFileSync(join(appRoot, "CLAUDE.md"), "utf8");

    expect(claude).toMatch(/CONTEXT\.md/);
    expect(claude).toMatch(/domain term/i);
  });

  it("CONTEXT.md lists flagged UI vs domain language mismatches", () => {
    const context = readFileSync(join(appRoot, "CONTEXT.md"), "utf8");

    expect(context).toMatch(/## Flagged ambiguities/);
    expect(context).toMatch(/Base Currency/i);
    expect(context).toMatch(/\*\*Trip currency\*\*/);
    expect(context).toMatch(/`isPaid`/);
    expect(context).toMatch(/\*\*Paid back\*\*/);
    expect(context).toMatch(/open splits/i);
    expect(context).toMatch(/settle splits/i);
    expect(context).toMatch(/simplify splits/i);
    expect(context).toMatch(/\*\*Balance\*\*/);
    expect(context).toMatch(/\*\*Settlement\*\*/);
    expect(context).toMatch(/\*\*Balance simplification\*\*/);
  });

  it("groups Language glossary terms under skimmable subheadings", () => {
    const context = readFileSync(join(appRoot, "CONTEXT.md"), "utf8");

    expect(context).toMatch(/### People/);
    expect(context).toMatch(/### Trips/);
    expect(context).toMatch(/### Expenses/);
    expect(context).toMatch(/### Money flow/);
    expect(context).toMatch(/### Budget/);
    expect(context).toMatch(/### Currency/);
  });
});
