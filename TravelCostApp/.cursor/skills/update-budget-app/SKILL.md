---
name: update-budget-app
description: >-
  Chooses and runs the correct Budget For Nomads (TravelCostApp) release flow —
  OTA patch, native EAS build, store submit, or full release — updates
  changelog.txt from git changes (consolidates into the current OTA suffix if the
  last update on the target branch was under 24h ago), and commits/pushes before
  publishing. Bare invocation defaults to production OTA. Use for
  /update-budget-app or when the user asks to deploy, release, ship, hotfix,
  OTA update, update changelog, push to production/alpha/staging, submit to App
  Store or Play Store, or bump the app version.
disable-model-invocation: true
---

# Update Budget App

Pick the **smallest correct release path** for TravelCostApp. All commands run from `TravelCostApp/` with **pnpm**. Prefer the wrapped scripts in `package.json` — they already pass `--non-interactive` to EAS.

**Always update `changelog.txt` before publishing** (Step 2). Release commands read from it; users see it in the Changelog screen.

## Step 1 — Classify the change

Inspect what changed since the last release:

```bash
cd TravelCostApp
git diff --name-only HEAD
```

### OTA-eligible (JS / assets only)

Typical paths: `components/`, `screens/`, `hooks/`, `store/`, `util/`, `i18n/`, `constants/`, `__tests__/`

No **native-rebuild** signals below, and **`app.config.js` / `app.json` `version` is unchanged**.

### Native rebuild required

| Signal | Examples |
|--------|----------|
| App version bumped | `app.config.js`, `app.json` `version` field |
| Expo / RN SDK or native deps | `package.json`, `pnpm-lock.yaml` |
| Native project or config | `ios/`, `android/`, `app.config.js` `plugins`, permissions, icons, splash |
| Runtime / channel config | `runtimeVersion`, `eas.json`, `updates.url` |
| Forced Apple SDK rebuild | ITMS-90725 (see [reference.md](reference.md)) |

`runtimeVersion` uses **`appVersion` policy** — OTA only reaches users on that exact store version (e.g. `1.3.005`).

## Step 2 — Update changelog.txt

Read `changelog.txt`, `app.config.js` version, and **what changed since the last changelog update**.

### 2a — Find the diff baseline

```bash
cd TravelCostApp
LAST_CL=$(git log -1 --format=%H -- changelog.txt)
git diff "$LAST_CL"..HEAD -- . ':!changelog.txt' ':!pnpm-lock.yaml'
git log --oneline "$LAST_CL"..HEAD
```

If `changelog.txt` was never committed, use the commit that introduced the current `__Newest Changes` version, or `HEAD~10` as fallback and note the uncertainty.

Read the newest block:

```
__Newest Changes:

1.3.005e          ← current changelog version (may include OTA suffix a–z)
- …
```

Confirm its **base** matches `app.config.js` (`1.3.005e` → app `1.3.005`). Mismatch → stop and fix before releasing.

### 2b — Decide: edit in place vs consolidate vs bump version line

Use the **target tier’s branch** from Step 3 (default `production`).

**Check last published OTA on that branch:**

```bash
cd TravelCostApp
BRANCH=production   # or alpha / staging / dev
eas update:list --branch "$BRANCH" --limit 1 --json --non-interactive 2>/dev/null || true
# If a group ID is returned, fetch createdAt:
eas update:view <groupId> --json 2>/dev/null || true
```

From the result:

- **Published version** — prefix of `message` before `:` (e.g. `1.3.005k`)
- **Published at** — `createdAt` from `eas update:view` (prefer over parsing “N hours ago” text)
- **Within 24h** — `now - createdAt < 24 hours`

| Situation | Action |
|-----------|--------|
| Newest block **not published yet** (no matching update on branch, or version mismatch) | **Edit bullets** in `__Newest Changes__` only (keep same version line). Do not add a new suffix. |
| Newest block **published** and **last update < 24h ago** on target branch | **Consolidate in place** — edit bullets under the **same** OTA suffix; do **not** run `version:bump:eas`. Republish with `update:{tier}`. |
| Newest block **published ≥ 24h ago** (or no reliable timestamp) | **Bump** via `version:bump:eas` — moves current block to `__Other Changes__` |
| Store release (`version:bump`) | Script creates new patch version block (e.g. `1.3.006`) — 24h rule does not apply |

**Consolidation (under 24h):** add or edit short bullets in the existing `__Newest Changes__` block — one idea per `-` line; keep `Bugfixes and performance improvements` on its own line. Same OTA suffix stays live — users see one changelog entry, not a new letter every few hours.

### 2c — Write bullets from the diff

Summarize **user-visible** changes only. Style rules: [changelog-style.md](changelog-style.md).

Quick rules:
- **Short bullets:** one scannable idea per `-` line; split related work into several bullets instead of one long line. See [changelog-style.md](changelog-style.md#short-bullets-required-rule).
- **Headline first:** the first `-` bullet becomes the EAS update message title.
- **OTA patch:** typically **2–4 short feature bullets** + `Bugfixes and performance improvements` on its **own line**. Pure internal fixes → bugfixes line only.
- **Consolidation (under 24h):** add or edit bullets in place — do not use `version:bump:eas --notes`.
- **Store release:** up to 2–3 feature bullets, then `Bugfixes and performance improvements` on its **own line**.
- **Never** combine bugfixes with a feature on one line (see [changelog-style.md](changelog-style.md)).
- Mirror recent tone: `Added …`, `Improved …`, `Fixed …`, `New …`; screen names as in the app.
- Pass one `--notes` per bullet to bump scripts:
  ```bash
  pnpm run version:bump:eas -- --notes "Improved Ask AI local price on Profile" "Added Settings info buttons" "Bugfixes and performance improvements"
  ```

Scan changed files for user-facing hints — e.g. `screens/`, `components/`, `i18n/` keys — not commit messages alone.

### 2d — Apply the changelog update

**Unpublished newest block — edit in place:**

Edit `changelog.txt` under `__Newest Changes:` only. Preserve section markers and structure.

**Published under 24h ago — consolidate in place (same OTA suffix):**

Edit `changelog.txt` under `__Newest Changes:` only — merge new bullets into the existing block; **keep the same version line**. Do not run `version:bump:eas`. Commit/push (Step 2e), then republish:

```bash
pnpm run update:production    # reads updated changelog; same suffix, new code
```

**OTA — new suffix (published ≥ 24h ago, or fresh OTA after long gap):**

```bash
pnpm run version:bump:eas -- --notes "Your concise bullet text"
pnpm run version:bump:eas -- --dry-run --notes "Preview"
```

Or publish + bump in one step. For feature + bugfixes, bump changelog first with two notes, then publish:

```bash
pnpm run version:bump:eas -- --notes "Your feature bullet" "Bugfixes and performance improvements"
pnpm run update:production
```

`update:production:bump -- "single message"` only accepts one string — use it for bugfixes-only releases, or use `version:bump:eas` with two `--notes` before `update:production`.

**Store release — new app version:**

```bash
pnpm run version:bump -- --notes "Headline feature" "Second feature"
```

`version:bump` also updates `app.config.js` and `app.json`.

Show the user the **old → new** changelog block before running publish/build commands unless they asked to run immediately.

### 2e — Commit and push changelog

**Always** commit and push version/changelog files before publishing (OTA or store). That keeps git, EAS update metadata, and the in-app Changelog screen aligned.

Run git from the **repo root** (`TravelCostApp/..`), not from `TravelCostApp/`.

**Files to stage:**

| Bump type | Stage |
|-----------|-------|
| OTA (`version:bump:eas` or edit in place) | `TravelCostApp/changelog.txt` |
| Store (`version:bump`) | `TravelCostApp/changelog.txt`, `TravelCostApp/app.config.js`, `TravelCostApp/app.json` |

```bash
cd ..   # repo root, if currently in TravelCostApp/
git add TravelCostApp/changelog.txt   # + app.config.js app.json for store bumps
git commit -m "$(cat <<'EOF'
Changelog 1.3.005k: Improved currency amounts in Overview, My Budgets, and trip history
EOF
)"
git push
```

**Commit message:** `Changelog {version}: {first bullet}` — use the version line and first bullet from `__Newest Changes__` (truncate long bullets if needed).

**When `update:{tier}:bump` bumps changelog after publish** (bugfixes-only shortcut): commit and push **after** that bump, not before.

**Skip only if** the user explicitly says not to commit/push in this session.

## Step 3 — Pick target audience

| Audience | Channel / branch | Typical use |
|----------|------------------|-------------|
| Developers | `dev` | Dev-client testing |
| Internal team | `staging` | Internal QA |
| Beta testers | `alpha` | TestFlight |
| Live users | `production` | App Store / Play |

**Default when the user does not name a tier** (e.g. bare `/update-budget-app` with no comment): treat as **OTA → `production`** (main / live users). Only ask for audience when they name another tier, ask to choose, or the change requires a native store binary (Step 4 Flow B/C).

## Step 4 — Choose the flow

```
Changes native-only? ──no──► OTA flow (Step 5)
        │
       yes
        ▼
Need store binary? ──no──► build:{tier}:{platform} only
        │
       yes
        ▼
Binary already built? ──yes──► submit:{tier}:{platform}
        │
       no
        ▼
build → submit (optional: submit+update)
```

### Flow A — OTA patch

**When:** JS/asset-only, same `app.config.js` version, changelog updated (Step 2).

**Last OTA on target branch under 24h ago** — consolidate (Step 2b/2d): edit `changelog.txt` in place, commit/push, then:

```bash
eas whoami
# Step 2e: commit + push changelog.txt (repo root)
pnpm run update:production -- --dry-run          # optional preview
pnpm run update:production                       # same suffix, updated bullets
```

**Last OTA ≥ 24h ago (or first OTA for this suffix)** — bump suffix, then publish:

```bash
eas whoami
pnpm run version:bump:eas -- --notes "Feature headline" "Bugfixes and performance improvements"
# Step 2e: commit + push changelog.txt (repo root)
pnpm run update:production -- --dry-run          # optional preview
pnpm run update:production                       # reads changelog automatically
```

Bugfixes-only OTA (`update:production:bump` bumps changelog **after** publish):

```bash
pnpm run update:production:bump -- "Bugfixes and performance improvements"
# Step 2e: commit + push changelog.txt (repo root)
```

Other tiers: `update:alpha`, `update:staging`, `update:dev`.

### Flow B — New store version

**When:** Native rebuild or `version:bump` already run in Step 2d.

```bash
pnpm run build:production:all
# Step 2e: commit + push changelog.txt, app.config.js, app.json (repo root)
pnpm run submit:production:ios
pnpm run submit:production:android
pnpm run update:production:bump -- "optional post-store OTA"
# Step 2e again if post-store bump changed changelog.txt
```

### Flow C — Submit + OTA

```bash
pnpm run submit+update:production:ios -- "Release 1.3.006"
pnpm run submit+update:production:android -- "Release 1.3.006"
```

### Flow D — Dev client rebuild

```bash
pnpm run build:dev:all
pnpm run update:dev -- "message"
```

### Flow E — Hotfix

| Urgency | Native? | Action |
|---------|---------|--------|
| Critical JS bug | No | Update changelog → `update:production:bump -- "HOTFIX: …"` |
| Critical native bug | Yes | Changelog → `build:production:{platform}` → `submit:production:{platform}` |

## Step 5 — Pre-flight checklist

```
- [ ] Working directory is TravelCostApp/ for pnpm/EAS; repo root for git
- [ ] `eas whoami` succeeds
- [ ] changelog.txt reflects git diff since last changelog commit
- [ ] Changelog base version matches app.config.js
- [ ] OTA path: checked last update on target branch — consolidate (under 24h) vs bump suffix (24h+)
- [ ] Changelog (and app version files for store bumps) committed and pushed
- [ ] Target tier confirmed (default: production OTA when user named none)
- [ ] Flow matches change classification (OTA vs native)
- [ ] For native store submit/build: user confirmed production if not already explicit
```

## Step 6 — Post-release verify

```bash
eas update:list --branch production --limit 3
eas build:list --limit 3
```

## Step 7 — Report back

1. **Flow chosen** and why
2. **Changelog** — version line and bullets (old → new)
3. **Git** — commit message and push result (or why skipped)
4. **Commands run** (or next steps)
5. **Who receives it** — channel/branch, store review if applicable

## Do not use

| Avoid | Use instead |
|-------|-------------|
| `pnpm run update` (`eas update --auto`) | `pnpm run update:{tier}` |
| `npm` / `yarn` | `pnpm` only |
| Generic changelog when diff shows a user-visible fix | Name the fix concisely |
| `version:bump` for OTA-only patches | `version:bump:eas` or edit in place |
| `version:bump:eas` when app version must change | `version:bump` + native build |
| `version:bump:eas` when last OTA on target branch was under 24h ago | Edit `changelog.txt` in place (consolidate), then `update:{tier}` |
| Publishing without checking changelog vs git diff | Step 2 first |
| Leaving changelog.txt uncommitted after a release | Step 2e commit + push before publish (after for `:bump` post-publish) |

## Additional resources

- Changelog style guide: [changelog-style.md](changelog-style.md)
- Command tables: [reference.md](reference.md)
- `TravelCostApp/EAS_DEPLOYMENT_GUIDE.md`
- `TravelCostApp/pipeline.md`
