# Update Budget App — Reference

## Channel / branch / environment map

From `scripts/eas-profiles.js` and `eas.json`:

| Tier | EAS channel | Update branch | EAS environment | Distribution |
|------|-------------|---------------|-----------------|--------------|
| production | `production` | `production` | `production` | store |
| alpha | `alpha` | `alpha` | `production` | store (TestFlight / Play draft) |
| staging | `staging` | `staging` | `production` | internal |
| dev | `dev` | `dev` | `development` | internal (dev client) |

## All release scripts (non-interactive)

Run from `TravelCostApp/`. Pass messages after `--`.

### OTA (EAS Update)

| Script | Branch | Changelog bump |
|--------|--------|----------------|
| `pnpm run update:production` | production | no |
| `pnpm run update:production:bump` | production | yes (suffix a→b→…→z) |
| `pnpm run update:alpha` | alpha | no |
| `pnpm run update:staging` | staging | no |
| `pnpm run update:dev` | dev | no |

`update:production` without `-- "message"` reads the newest `changelog.txt` block and publishes `{version}: {first bullet}`.

`update:production:bump` accepts `--dry-run` to preview publish + changelog bump without writing.

### Version bumps

| Script | Changes | When |
|--------|---------|------|
| `pnpm run version:bump` | `app.config.js`, `app.json`, `changelog.txt` (patch +1) | New store binary |
| `pnpm run version:bump:eas` | `changelog.txt` suffix only (`1.3.005e` → `f`) | OTA tracking within same app version |

Both support `--dry-run` and `--notes "bullet one" "bullet two"`.

### EAS Build

| Script | Profile |
|--------|---------|
| `build:production:ios` / `:android` / `:all` | production |
| `build:alpha:ios` / `:android` / `:all` | alpha |
| `build:staging:ios` / `:android` / `:all` | staging |
| `build:dev:ios` / `:android` / `:all` | development-simulator |
| `build:dev:device:ios` / `:device:android` | development |
| `build:prod` | alias for `build:production:all` |

### EAS Submit

| Script | Profile |
|--------|---------|
| `submit:production:ios` / `:android` | production |
| `submit:alpha:ios` / `:android` | alpha |
| `submit:prod:ios` / `:prod:android` | aliases for production |

All use `--latest --non-interactive`.

### Submit + OTA combo

| Script | Does |
|--------|------|
| `submit+update:production:ios` | submit latest iOS production build → OTA on `production` |
| `submit+update:production:android` | same for Android |
| `submit+update:alpha:ios` | submit latest alpha iOS → OTA on `alpha` |
| `submit+update:alpha:android` | same for Android |

## Version model

- **App version** (`app.config.js` / `app.json`): e.g. `1.3.005` — drives `runtimeVersion` (`policy: appVersion`) and store listing.
- **EAS changelog suffix** (`changelog.txt` newest block): e.g. `1.3.005e` — tracks OTAs within one app version without bumping the binary.

OTA users must already have a binary built with matching `runtimeVersion`. After `version:bump`, existing users on `1.3.005` will **not** receive OTAs published for `1.3.006` until they install the new store build.

## Changelog maintenance

File: `TravelCostApp/changelog.txt`. Structure is fixed — do not rename markers:

```
Changelog Travel Expense App

__Newest Changes:

{version}
- {bullet}

__Other Changes:

{older blocks…}
```

### Diff baseline

```bash
LAST_CL=$(git log -1 --format=%H -- changelog.txt)
git diff "$LAST_CL"..HEAD -- . ':!changelog.txt' ':!pnpm-lock.yaml'
```

### Update methods

| Goal | Method |
|------|--------|
| Fix bullets before first publish of current suffix | Edit `__Newest Changes__` in place |
| New OTA suffix | `pnpm run version:bump:eas -- --notes "feature" "Bugfixes and performance improvements"` then `update:production` |
| New store version | `pnpm run version:bump -- --notes "headline" "Bugfixes and performance improvements"` |

`Bugfixes and performance improvements` must always be its own bullet — never on the same line as a feature. See [changelog-style.md](changelog-style.md).

`update:production` (no args) publishes using newest block: `{version}: {first bullet}`.

Writing style: [changelog-style.md](changelog-style.md).

### Git commit and push

After updating `changelog.txt` (Step 2d), commit and push from the **repo root** before publishing — except when `update:*:bump` bumps the changelog **after** publish; then commit after the bump.

| Bump type | Files |
|-----------|-------|
| OTA / edit in place | `TravelCostApp/changelog.txt` |
| Store (`version:bump`) | `TravelCostApp/changelog.txt`, `app.config.js`, `app.json` |

Commit message: `Changelog {version}: {first bullet}` → `git push`. Skip only if the user explicitly opts out for the session.

## Change → flow quick lookup

| Changed paths | Flow |
|---------------|------|
| `*.tsx`, `*.ts`, `i18n/`, tests only | OTA to target tier |
| `changelog.txt` only | Usually paired with `update:*:bump` or `version:bump:eas` |
| `app.config.js` version or plugins | `version:bump` → `build:*` → `submit:*` |
| `package.json` native deps | `build:*` (tier as needed); OTA only after binary ships |
| `ios/`, `android/` | `build:*` → `submit:*` if store-facing |
| `eas.json` | Rebuild affected profiles; verify channel mapping |

## Debug commands

```bash
eas whoami
eas channel:list
eas branch:list
eas update:list --branch production --limit 5
eas build:list --limit 5
```

## Apple SDK rejection (ITMS-90725)

Rebuild with pinned Xcode image in `eas.json` (`macos-sequoia-15.6-xcode-26.2`):

```bash
pnpm run build:production:ios
pnpm run submit:production:ios
```

Confirm EAS build log shows Xcode 26.x under "Spin up build environment".

## Recommended tier progression

```
dev → staging → alpha → production
```

Do not skip tiers for risky changes unless the user explicitly requests a production hotfix.
