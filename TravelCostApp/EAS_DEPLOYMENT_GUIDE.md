# EAS Build & Update Guide for Travel Cost App

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Our Deployment Strategy](#our-deployment-strategy)
3. [Build Commands](#build-commands)
4. [Update Commands](#update-commands)
5. [Common Workflows](#common-workflows)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### What is EAS?

EAS (Expo Application Services) provides cloud-based building and over-the-air updates for React Native apps.

- **EAS Build**: Build iOS/Android apps in the cloud
- **EAS Update**: Push JavaScript updates instantly (no app store review)

### Key Concepts

- **Channels**: Who gets updates (production, alpha, staging, dev)
- **Build Profiles**: How your app is built and which channel it connects to
- **Distribution**: Internal (direct install) vs Store (App Store/TestFlight)

---

## Our Deployment Strategy

### 🎯 **Four-Tier Deployment**

| Tier            | Channel      | Distribution | Purpose            | Users         |
| --------------- | ------------ | ------------ | ------------------ | ------------- |
| **Production**  | `production` | Store        | App Store release  | All customers |
| **Alpha**       | `alpha`      | Store        | TestFlight testing | Beta testers  |
| **Staging**     | `staging`    | Internal     | Internal testing   | Internal team |
| **Development** | `dev`        | Internal     | Development        | Developers    |

### 🔄 **Update Flow**

```
Code changes → Git commit → Push to EAS branch → Channel receives update → Users get update
```

## Build Commands

### 🏗️ **Build Commands**

| Command                            | What it does                        | When to use             |
| ---------------------------------- | ----------------------------------- | ----------------------- |
| `npm run build:production:ios`     | Build iOS for production            | Ready for App Store     |
| `npm run build:production:android` | Build Android for production        | Ready for Play Store    |
| `npm run build:production:all`     | Build both platforms for production | Full production release |
| `npm run build:alpha:ios`          | Build iOS for alpha testing         | TestFlight testing      |
| `npm run build:alpha:android`      | Build Android for alpha testing     | Internal testing        |
| `npm run build:alpha:all`          | Build both platforms for alpha      | Full alpha testing      |
| `npm run build:staging:ios`        | Build iOS for staging               | Internal testing        |
| `npm run build:staging:android`    | Build Android for staging           | Internal testing        |
| `npm run build:staging:all`        | Build both platforms for staging    | Full staging build      |
| `npm run build:dev:ios`            | Build iOS for development           | Local testing           |
| `npm run build:dev:android`        | Build Android for development       | Local testing           |
| `npm run build:dev:all`            | Build both platforms for dev        | Full development build  |

### 📤 **Submit Commands**

| Command                             | What it does                        | When to use          |
| ----------------------------------- | ----------------------------------- | -------------------- |
| `npm run submit:production:ios`     | Submit iOS to App Store             | Ready for App Store  |
| `npm run submit:production:android` | Submit Android to Play Store        | Ready for Play Store |
| `npm run submit:alpha:ios`          | Submit iOS to TestFlight            | Alpha testing        |
| `npm run submit:alpha:android`      | Submit Android for internal testing | Alpha testing        |

## Update Commands

### 📦 **Update Commands**

| Command                     | What it does                  | When to use            |
| --------------------------- | ----------------------------- | ---------------------- |
| `npm run update:production` | Updates production users      | Ready for live release |
| `npm run update:alpha`      | Updates alpha testers         | Ready for testing      |
| `npm run update:staging`    | Updates staging testers       | Internal testing       |
| `npm run update:dev`        | Updates developers            | Testing new features   |
| `npm run update`            | Auto-update (uses git branch) | Quick updates          |

### 🚀 **Update Process**

1. **Make your changes** and commit to git
2. **Choose your target** and run the appropriate update command
3. **Users get the update** automatically (no app store review needed)

---

## Common Workflows

### 🛠️ **Development Workflow**

```bash
# 1. Make changes and test locally
npm run update:dev "Testing new feature"

# 2. Test on staging for internal review
npm run build:staging:all
npm run update:staging "Ready for internal testing"
```

### 🧪 **Alpha Testing Workflow**

```bash
# 1. Build and submit to TestFlight
npm run build:alpha:ios
npm run submit:alpha:ios

# 2. Push updates to alpha testers
npm run update:alpha "Feature ready for beta testing"
```

### 🚀 **Production Release Workflow**

```bash
# 1. Build and submit to app stores
npm run build:production:all
npm run submit:production:ios
npm run submit:production:android

# 2. Push updates to production users
npm run update:production "Feature released to production"
```

### 🔄 **Hotfix Workflow**

```bash
# Critical bug fix - push immediately to production
npm run update:production "HOTFIX: Critical bug resolved"
```

## Troubleshooting

### ❓ **Common Issues**

- **Update not appearing**: Check device has correct build profile, wait a few minutes
- **Wrong channel**: Verify `eas.json` configuration
- **Update failed**: Check internet connection and EAS login (`eas whoami`)

### 🔍 **Debug Commands**

```bash
eas channel:list    # See all channels
eas branch:list     # See all branches
eas update:list     # See recent updates
eas whoami          # Check login status
```

---

## Quick Reference

### 📋 **Essential Commands**

```bash
# Updates (no app store review needed)
npm run update:dev "Message"        # → Development
npm run update:staging "Message"    # → Internal testing
npm run update:alpha "Message"      # → Beta testers
npm run update:production "Message" # → All users

# Builds (requires app store review)
npm run build:staging:all           # → Internal testing
npm run build:alpha:all             # → TestFlight
npm run build:production:all        # → App Store

# Submit to stores
npm run submit:alpha:ios            # → TestFlight
npm run submit:production:ios       # → App Store
npm run submit:production:android   # → Play Store
```

### 🎯 **Update Message Format**

```
TYPE: Brief description

Examples:
- "FIX: Fixed expense calculation bug"
- "FEATURE: Added dark mode support"
- "HOTFIX: Critical login issue resolved"
```

---

## 🎉 Ready to Deploy!

**Remember**: Always test on `dev` → `staging` → `alpha` → `production`
