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

## Bugfixes line (required rule)

**Always** put `Bugfixes and performance improvements` on its **own bullet line**. Never combine it with a feature/fix on the same line.

```
# Wrong
- New Layout for Modals, bugfixes and performance improvements

# Right
- New Layout for Modals
- Bugfixes and performance improvements
```

When using `version:bump`, `version:bump:eas`, or `update:*:bump`, pass **two notes**:

```bash
pnpm run version:bump:eas -- --notes "Improved offline ranged expenses" "Bugfixes and performance improvements"
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
- Combine small related **features** on one line with commas when they're all minor — but never append bugfixes to that line.

## Do not write

- File paths, PR numbers, refactor/test-only work, internal renames.
- "Updated dependencies", "Bumped expo", unless it's the main user-visible story of a store release.
- Long lists — cap at **1 feature bullet** for OTA patches, **2–3 feature bullets** for store releases, then the bugfixes line.

## Consolidation (same OTA suffix within 24h)

When the last OTA on the target branch was published **under 24 hours ago** and matches the newest changelog version, **do not** bump the suffix. Edit the existing `__Newest Changes__` block: merge new user-visible work into the feature bullet(s), keep `Bugfixes and performance improvements` on its own line, then republish with `update:{tier}`.

```
# Was (1.3.005k, published 2h ago)
1.3.005k
- Improved action buttons across Settings
- Bugfixes and performance improvements

# After consolidating today's fix — still 1.3.005k
1.3.005k
- Improved action buttons across Settings; fixed expense amount rounding in split summary
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

**OTA — small feature + polish:**
```
1.3.005f
- New Layout for Modals
- Bugfixes and performance improvements
```

**Store release — multiple features:**
```
1.3.006
- Added restore feature after delete expense
- Improved Charts (try zooming and moving!)
- Bugfixes and performance improvements
```
