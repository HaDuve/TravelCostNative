---
name: update-budget-app
description: Chooses and runs the correct Budget For Nomads (TravelCostApp) release flow — OTA patch, native EAS build, store submit, or full release — and updates changelog.txt from git changes in the project's existing style. Bare invocation (no tier) defaults to production OTA. Use when the user asks to deploy, release, ship, hotfix, OTA update, update changelog, push to production/alpha/staging, submit to App Store or Play Store, or bump the app version.
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

### 2b — Decide: edit in place vs bump version line

| Situation | Action |
|-----------|--------|
| Newest block **not published yet** and bullets are wrong/incomplete | **Edit bullets** in `__Newest Changes__` only (keep same version line). Do not add a new suffix. |
| Newest block **already published** (or ready to ship as-is) | **Bump** via script (next step) — moves current block to `__Other Changes__` |
| Store release (`version:bump`) | Script creates new patch version block (e.g. `1.3.006`) |

Check whether the current newest OTA was already published:

```bash
eas update:list --branch production --limit 1 --non-interactive 2>/dev/null || true
```

### 2c — Write bullets from the diff

Summarize **user-visible** changes only. Style rules: [changelog-style.md](changelog-style.md).

Quick rules:
- **OTA patch:** 1 feature bullet + `Bugfixes and performance improvements` on its **own line** (2 bullets total). Pure internal fixes → bugfixes line only.
- **Store release:** up to 2–3 feature bullets, then `Bugfixes and performance improvements` on its **own line**.
- **Never** combine bugfixes with a feature on one line (see [changelog-style.md](changelog-style.md)).
- Mirror recent tone: `Added …`, `Improved …`, `Fixed …`, `New …`; screen names as in the app.
- Pass multiple `--notes` to bump scripts — one per bullet:
  ```bash
  pnpm run version:bump:eas -- --notes "Improved offline ranged expenses" "Bugfixes and performance improvements"
  ```

Scan changed files for user-facing hints — e.g. `screens/`, `components/`, `i18n/` keys — not commit messages alone.

### 2d — Apply the changelog update

**Unpublished newest block — edit in place:**

Edit `changelog.txt` under `__Newest Changes:` only. Preserve section markers and structure.

**OTA — new suffix (after publish or fresh OTA):**

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

```bash
eas whoami
pnpm run version:bump:eas -- --notes "Feature headline" "Bugfixes and performance improvements"
pnpm run update:production -- --dry-run          # optional preview
pnpm run update:production                       # reads changelog automatically
```

Bugfixes-only OTA:

```bash
pnpm run update:production:bump -- "Bugfixes and performance improvements"
```

Other tiers: `update:alpha`, `update:staging`, `update:dev`.

### Flow B — New store version

**When:** Native rebuild or `version:bump` already run in Step 2d.

```bash
pnpm run build:production:all
pnpm run submit:production:ios
pnpm run submit:production:android
pnpm run update:production:bump -- "optional post-store OTA"
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
- [ ] Working directory is TravelCostApp/
- [ ] `eas whoami` succeeds
- [ ] changelog.txt reflects git diff since last changelog commit
- [ ] Changelog base version matches app.config.js
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
3. **Commands run** (or next steps)
4. **Who receives it** — channel/branch, store review if applicable

## Do not use

| Avoid | Use instead |
|-------|-------------|
| `pnpm run update` (`eas update --auto`) | `pnpm run update:{tier}` |
| `npm` / `yarn` | `pnpm` only |
| Generic changelog when diff shows a user-visible fix | Name the fix concisely |
| `version:bump` for OTA-only patches | `version:bump:eas` or edit in place |
| `version:bump:eas` when app version must change | `version:bump` + native build |
| Publishing without checking changelog vs git diff | Step 2 first |

## Additional resources

- Changelog style guide: [changelog-style.md](changelog-style.md)
- Command tables: [reference.md](reference.md)
- `TravelCostApp/EAS_DEPLOYMENT_GUIDE.md`
- `TravelCostApp/pipeline.md`
