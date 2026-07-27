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

## Voice (recent 1.3.x entries)

| Pattern | Example |
|---------|---------|
| Added feature | `Added restore feature after delete expense` |
| Improved | `Improved Splitting Expenses (auto balances splits)` |
| Fixed | `Fixed sync` |
| New UI | `New Layout for Modals, bugfixes and performance improvements` |
| Minor OTA | `Bugfixes and performance improvements` (alone is fine) |

- **Title case** for feature words; screen names as users see them (Overview, Expense Form, Settings Screen).
- Combine small related items on **one line** with commas when they're all minor.
- End with `Bugfixes and performance improvements` when anything beyond a pure typo fix shipped — often on the same line as the headline change for small OTAs.

## Do not write

- File paths, PR numbers, refactor/test-only work, internal renames.
- "Updated dependencies", "Bumped expo", unless it's the main user-visible story of a store release.
- Long lists — cap at **1 bullet** for OTA patches, **3–4** for store releases (plus bugfixes line if needed).

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
```

**OTA — small feature + polish (one line, like 1.3.005e):**
```
1.3.005f
- New Layout for Modals, bugfixes and performance improvements
```

**Store release — multiple features:**
```
1.3.006
- Added restore feature after delete expense
- Improved Charts (try zooming and moving!)
- Bugfixes and performance improvements
```
