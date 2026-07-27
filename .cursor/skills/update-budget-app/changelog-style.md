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
