# Package manager (pnpm)

TravelCostApp uses **pnpm only** for the React Native app. Do not run `npm install` or `npm ci` in `TravelCostApp/` — that recreates `package-lock.json` and breaks CI/EAS.

## Version and lockfile

| Item | Value |
|------|--------|
| Package manager | [pnpm](https://pnpm.io/) **10.15.0** |
| Lockfile | `pnpm-lock.yaml` (committed) |
| Declared in | `package.json` → `"packageManager": "pnpm@10.15.0"` |

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

## Everyday commands

From `TravelCostApp/`:

```bash
pnpm install
pnpm install --frozen-lockfile   # CI / reproducible installs
pnpm test
pnpm run ios
pnpm run android
pnpm run start
pnpm run lint
```

### EAS scripts (local CLI → cloud)

```bash
pnpm run build:production:ios
pnpm run build:staging:all
pnpm run build:dev:ios              # dev client, iOS simulator (EAS)
pnpm run build:dev:device:android   # dev client, physical device (EAS)
pnpm run update:staging -- "message"
pnpm run submit:prod:ios
```

Shorthand aliases: `build:dev`, `build:prod`, `submit:prod:ios`, `submit:prod:android`.

See [EAS_DEPLOYMENT_GUIDE.md](../EAS_DEPLOYMENT_GUIDE.md).

## Enforcement

| Surface | Mechanism |
|---------|-----------|
| Local | `pnpm` + `pnpm-lock.yaml` |
| GitHub Actions | `.github/workflows/test.yml` — `pnpm install --frozen-lockfile`, `pnpm test` |
| EAS Build | `eas.json` — `"pnpm": "10.15.0"` on every build profile |

## Global CLIs (npm is OK)

```bash
npm install -g eas-cli firebase-tools @expo/cli
```

## Exception: `functions/`

Firebase Cloud Functions use **npm** in `TravelCostApp/functions/` (`functions/package-lock.json`).

## Do not commit

`TravelCostApp/package-lock.json` (gitignored).

## Adding dependencies

```bash
pnpm add <package>
pnpm add -D <package>
```

Commit `package.json` and `pnpm-lock.yaml`.
