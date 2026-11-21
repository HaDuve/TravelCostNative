# Changelog writing style

Match `TravelCostApp/changelog.txt`. User-facing, concise, no dev jargon.

## Format

```
__Newest Changes:

1.3.005f
- Specific change here
- Bugfixes and performance improvements

__Other Changes:
```

- Version line alone (no `v` prefix). OTA suffix: `1.3.005f`. Store release: `1.3.006`.
- Bullets: `- ` prefix, no trailing period.
- Blank line between version blocks in `__Other Changes__`.

## Critical OTAs (required rule)

Most OTAs are **not** critical. Only mark an update critical when users must apply it soon (e.g. cost/security/data-loss fix). The force-apply overlay (check → fetch → branded block → reload) runs **only** for critical updates.

**Token:** append `!` to the **version line** (no space): `1.3.005n!`. Bullets stay normal user-facing copy — do not put `CRITICAL` / `[CRITICAL]` in bullet text.

```
# Critical OTA
1.3.005n!
- Fix excessive data usage: stop repeated trip downloads for unnamed budgets

# Normal OTA (default) — no bang
1.3.005m
- New Premium Nomad status screen with perks, renewal dates, and manage subscription
- Bugfixes and performance improvements
```

Rules:
- Put `!` only on the version line of that block — never inside bullets.
- Do **not** invent variants (`!!`, ` *`, `[CRITICAL]`). Parsers and the force-overlay gate look for a version line ending in `!` (EAS message shape: `{version}!: {first bullet}`).
- When consolidating under 24h: if the block is already critical, keep the `!` on the version line; if you are promoting a normal block to critical, add `!` to the version line before republishing.
- After `version:bump:eas`, the new version line is unmarked by default — edit it to add `!` when the new OTA must force-apply.
- Store releases can use `1.3.006!` the same way when a hard apply is required; default remains unmarked.
- A short rules reminder may live at the top of `changelog.txt` (above `__Newest Changes:`); the in-app Changelog screen ignores that preamble. The version string may show a trailing `!` in-app — that is intentional and quiet.

## Short bullets (required rule)

Each `-` line becomes its own bullet in the app. Prefer **several short bullets** over one long run-on line.

- **One idea per line** — a single scannable sentence (or phrase) the user can read in one glance.
- **New thought → new `-` bullet** — do not chain unrelated changes with semicolons on one line.
- Put the **headline change first** — EAS update messages use only the first `-` bullet after the version line.
- `Bugfixes and performance improvements` stays on its **own** bullet line (never combine with a feature).

```
# Wrong — one wall of text
- Improved Ask AI local price on Profile with optional country, currency, and date range; added Settings info buttons and Ask AI toggle; improved ranged local-price deal prompts

# Right — several short bullets
- Improved Ask AI local price on Profile with optional country, currency, and date range
- Added Settings info buttons and Ask AI toggle
- Improved ranged local-price deal prompts
```

Indented continuation lines (two leading spaces) still merge into the previous bullet in-app — use only when one idea truly spans a line break. Prefer a new `-` bullet instead.

## Bugfixes line (required rule)

**Always** put `Bugfixes and performance improvements` on its **own bullet line**. Never combine it with a feature/fix on the same line.

```
# Wrong
- New Layout for Modals, bugfixes and performance improvements

# Right
- New Layout for Modals
- Bugfixes and performance improvements
```

When using `version:bump`, `version:bump:eas`, or `update:*:bump`, pass **one `--notes` per bullet** (feature lines, then bugfixes):

```bash
pnpm run version:bump:eas -- --notes \
  "Improved Ask AI local price on Profile with optional country, currency, and date range" \
  "Added Settings info buttons and Ask AI toggle" \
  "Improved ranged local-price deal prompts" \
  "Bugfixes and performance improvements"
```

For a single visible fix, two notes are enough:

```bash
pnpm run version:bump:eas -- --notes "Fixed expense amount rounding in split summary" "Bugfixes and performance improvements"
```

Skip the bugfixes line only when the release is **purely** internal with no user-visible headline — then a single bullet is fine:

```
1.3.005f
- Bugfixes and performance improvements
```

## Voice (recent 1.3.x entries)

| Pattern | Example |
|---------|---------|
| Added feature | `Added restore feature after delete expense` |
| Improved | `Improved Splitting Expenses (auto balances splits)` |
| Fixed | `Fixed sync` |
| New UI | `New Layout for Modals` |
| Bugfixes | `Bugfixes and performance improvements` (always its own line) |

- **Title case** for feature words; screen names as users see them (Overview, Expense Form, Settings Screen).
- Split related work into **separate short bullets** instead of joining with semicolons; never append bugfixes to a feature line.

## Do not write

- File paths, PR numbers, refactor/test-only work, internal renames.
- "Updated dependencies", "Bumped expo", unless it's the main user-visible story of a store release.
- Long run-on bullets — prefer several short `-` lines (typically **2–4 feature bullets** for an OTA, **2–3** for a store release), then the bugfixes line.

## Consolidation (same OTA suffix within 24h)

When the last OTA on the target branch was published **under 24 hours ago** and matches the newest changelog version, **do not** bump the suffix. Edit the existing `__Newest Changes__` block: merge new user-visible work into the feature bullet(s), keep `Bugfixes and performance improvements` on its own line, then republish with `update:{tier}`.

```
# Was (1.3.005k, published 2h ago)
1.3.005k
- Improved action buttons across Settings
- Bugfixes and performance improvements

# After consolidating today's fix — still 1.3.005k
1.3.005k
- Improved action buttons across Settings
- Fixed expense amount rounding in split summary
- Bugfixes and performance improvements
```

## Examples by size

**OTA — tiny fix (no user-visible headline):**
```
1.3.005f
- Bugfixes and performance improvements
```

**OTA — one visible fix:**
```
1.3.005f
- Fixed expense amount rounding in split summary
- Bugfixes and performance improvements
```

**OTA — critical force-apply:**
```
1.3.005n!
- Fix excessive data usage: stop repeated trip downloads for unnamed budgets
```

**OTA — small feature + polish:**
```
1.3.005f
- New Layout for Modals
- Bugfixes and performance improvements
```

**OTA — several related features (typical patch):**
```
1.3.005l
- Improved Ask AI local price on Profile with optional country, currency, and date range
- Added Settings info buttons and Ask AI toggle
- Improved ranged local-price deal prompts
- Bugfixes and performance improvements
```

**Store release — multiple features:**
```
1.3.006
- Added restore feature after delete expense
- Improved Charts (try zooming and moving!)
- Bugfixes and performance improvements
```
