# EAS Build & Update Guide for Travel Cost App

## 📚 Table of Contents

1. [What is EAS?](#what-is-eas)
2. [Key Concepts Explained](#key-concepts-explained)
3. [Our App's Deployment Strategy](#our-apps-deployment-strategy)
4. [How to Build Your App](#how-to-build-your-app)
5. [How to Update Your App](#how-to-update-your-app)
6. [Build Profiles and Channels](#build-profiles-and-channels)
7. [Common Workflows](#common-workflows)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## What is EAS?

EAS (Expo Application Services) is a suite of cloud services for building, updating, and deploying React Native apps. It includes:

### **EAS Build** - Cloud-based app building

- **No Local Setup**: Build iOS and Android apps in the cloud
- **Consistent Environment**: Same build environment every time
- **Multiple Profiles**: Different build configurations for different purposes

### **EAS Update** - Over-the-air updates

- **Fast Updates**: Push JavaScript and asset updates instantly
- **No App Store Review**: Skip the 1-7 day review process
- **Targeted Updates**: Send different updates to different user groups
- **Rollback Capability**: Quickly revert problematic updates

### Why Use EAS?

- **Faster Development**: No need to set up complex build environments
- **Reliable Builds**: Cloud infrastructure handles all the complexity
- **Instant Updates**: Push fixes and features without app store approval
- **Team Collaboration**: Share builds and updates easily

---

## Key Concepts Explained

### 🏷️ **Channels** (Distribution Targets)

Channels are like "mailing lists" for your app updates. They determine which users receive which updates.

**Think of it like this:**

- `production` channel = All your paying customers
- `alpha` channel = Beta testers and internal team
- `dev` channel = Developers and testers

### 🌿 **Branches** (Update Sequences)

Branches are like "timelines" of updates. Each branch contains a sequence of updates that can be sent to a channel.

**Think of it like this:**

- `main` branch = Stable, production-ready updates
- `alpha` branch = Testing updates for beta users
- `dev` branch = Experimental updates for developers

### 🔗 **Channel-Branch Linking**

You link channels to branches to control which updates go where.

**Our Setup:**

```
Channel "production" ← linked to ← Branch "production" (Live users)
Channel "alpha"     ← linked to ← Branch "alpha"       (Beta testers)
Channel "dev"       ← linked to ← Branch "dev"         (Developers)
```

### 📱 **Build Profiles**

Build profiles in `eas.json` define how your app is built and which channel it connects to.

---

## Our App's Update Strategy

### 🎯 **Three-Tier Deployment**

| Tier            | Channel      | Branch       | Purpose      | Users                              |
| --------------- | ------------ | ------------ | ------------ | ---------------------------------- |
| **Production**  | `production` | `production` | Live app     | All customers                      |
| **Alpha**       | `alpha`      | `alpha`      | Beta testing | TestFlight users, internal testing |
| **Development** | `dev`        | `dev`        | Development  | Developers, personal devices       |

### 🔄 **Update Flow**

```
1. Code changes → Git commit
2. Push to EAS branch → Channel receives update
3. Users with matching builds → Get the update
```

---

## How to Build Your App

### 🏗️ **Step-by-Step Build Process**

#### **1. Choose Your Build Target**

**For Development Testing:**

```bash
npm run build:dev:ios        # iOS development build
npm run build:dev:android    # Android development build
npm run build:dev:all        # Both platforms
```

**For Alpha/Beta Testing:**

```bash
npm run build:alpha:ios      # iOS alpha build (TestFlight)
npm run build:alpha:android  # Android alpha build (Internal testing)
npm run build:alpha:all      # Both platforms
```

**For Production Release:**

```bash
npm run build:production:ios     # iOS production build (App Store)
npm run build:production:android # Android production build (Play Store)
npm run build:production:all     # Both platforms
```

#### **2. Monitor Your Build**

- Builds run in the cloud and take 5-15 minutes
- You'll get a link to monitor progress
- Build logs are available in the EAS dashboard

#### **3. Download and Install**

- **Development builds**: Install directly on your device
- **Alpha builds**: Upload to TestFlight or distribute internally
- **Production builds**: Submit to app stores

### 📱 **Build Profiles Explained**

| Profile       | Channel      | Distribution | Purpose                       |
| ------------- | ------------ | ------------ | ----------------------------- |
| `development` | `dev`        | Internal     | Local development and testing |
| `alpha`       | `alpha`      | Internal     | Beta testing and TestFlight   |
| `production`  | `production` | Store        | App Store and Play Store      |

### 📤 **Step-by-Step Submit Process**

#### **1. Build Your App First**

```bash
# Choose your target
npm run build:production:ios     # For App Store
npm run build:alpha:ios          # For TestFlight
npm run build:production:android # For Play Store
```

#### **2. Submit to App Stores**

```bash
# Submit to App Store
npm run submit:production:ios

# Submit to Play Store
npm run submit:production:android

# Submit to TestFlight
npm run submit:alpha:ios

# Quick TestFlight (builds + submits)
npm run testflight
```

#### **3. Monitor Submission**

- **iOS**: Check App Store Connect for review status
- **Android**: Check Google Play Console for review status
- **TestFlight**: Check TestFlight for beta testing status

---

## How to Update Your App

### 📦 **Available Commands**

| Command                     | What it does                  | When to use            |
| --------------------------- | ----------------------------- | ---------------------- |
| `npm run update:production` | Updates production users      | Ready for live release |
| `npm run update:alpha`      | Updates beta testers          | Ready for testing      |
| `npm run update:dev`        | Updates developers            | Testing new features   |
| `npm run update`            | Auto-update (uses git branch) | Quick updates          |

### 🏗️ **Build Commands**

| Command                            | What it does                        | When to use             |
| ---------------------------------- | ----------------------------------- | ----------------------- |
| `npm run build:production:ios`     | Build iOS for production            | Ready for App Store     |
| `npm run build:production:android` | Build Android for production        | Ready for Play Store    |
| `npm run build:production:all`     | Build both platforms for production | Full production release |
| `npm run build:alpha:ios`          | Build iOS for alpha testing         | TestFlight testing      |
| `npm run build:alpha:android`      | Build Android for alpha testing     | Internal testing        |
| `npm run build:alpha:all`          | Build both platforms for alpha      | Full alpha testing      |
| `npm run build:dev:ios`            | Build iOS for development           | Local testing           |
| `npm run build:dev:android`        | Build Android for development       | Local testing           |
| `npm run build:dev:all`            | Build both platforms for dev        | Full development build  |

### 📤 **Submit Commands**

| Command                             | What it does                        | When to use             |
| ----------------------------------- | ----------------------------------- | ----------------------- |
| `npm run submit:production:ios`     | Submit iOS to App Store             | Ready for App Store     |
| `npm run submit:production:android` | Submit Android to Play Store        | Ready for Play Store    |
| `npm run submit:alpha:ios`          | Submit iOS to TestFlight            | Alpha testing           |
| `npm run submit:alpha:android`      | Submit Android for internal testing | Alpha testing           |
| `npm run testflight`                | Build + Submit iOS to TestFlight    | Quick TestFlight deploy |

### 🚀 **Step-by-Step Update Process**

#### **1. Make Your Changes**

```bash
# Work on any git branch
git checkout feature/new-feature
# Make your code changes
git add .
git commit -m "Add new feature"
```

#### **2. Choose Your Update Target**

**For Development Testing:**

```bash
npm run update:dev "Testing new feature locally"
```

**For Alpha/Beta Testing:**

```bash
npm run update:alpha "New feature ready for testing"
```

**For Production Release:**

```bash
npm run update:production "New feature released"
```

#### **3. Verify the Update**

```bash
# Check which updates are available
eas update:list

# View specific update details
eas update:view [update-id]
```

---

## Build Profiles and Channels

### 🏗️ **Build Profiles in eas.json**

```json
{
  "build": {
    "development": {
      "channel": "dev", // ← Connects to dev channel
      "developmentClient": true
    },
    "alpha": {
      "channel": "alpha", // ← Connects to alpha channel
      "distribution": "internal"
    },
    "production": {
      "channel": "production", // ← Connects to production channel
      "autoIncrement": true
    }
  }
}
```

### 🔄 **How Channels Work**

1. **Build Time**: When you build your app, it gets "locked" to a specific channel
2. **Update Time**: When you push an update to a branch, it goes to the linked channel
3. **Runtime**: Users with builds from that channel receive the update

---

## Common Workflows

### 🛠️ **Development Workflow**

```bash
# 1. Start development
git checkout -b feature/expense-tracking
# Make changes...

# 2. Test on dev builds
npm run update:dev "Added expense tracking"

# 3. Test on your device (if it has dev build)
# The update will appear automatically
```

### 🧪 **Alpha Testing Workflow**

```bash
# 1. Build alpha version
npm run build:alpha:ios

# 2. Submit to TestFlight
npm run submit:alpha:ios

# 3. Push updates to alpha testers
npm run update:alpha "Expense tracking ready for alpha testing"

# 4. TestFlight users will get the update
# 5. Gather feedback and iterate
```

### 🚀 **Production Release Workflow**

```bash
# 1. Build production version
npm run build:production:all

# 2. Submit to app stores
npm run submit:production:ios     # Submit to App Store
npm run submit:production:android # Submit to Play Store

# 3. Push updates to production users
npm run update:production "Expense tracking released to production"

# 4. All production users get the update
# 5. Monitor for issues
```

### 🔄 **Hotfix Workflow**

```bash
# 1. Critical bug found in production
git checkout main
# Fix the bug...

# 2. Push hotfix immediately
npm run update:production "Critical bug fix - expense calculation"

# 3. Users get the fix within minutes
```

---

## Troubleshooting

### ❓ **Common Issues**

#### **"Update not appearing on device"**

- Check if your device has the correct build profile
- Verify the channel-branch connection
- Wait a few minutes for the update to propagate

#### **"Wrong channel receiving updates"**

- Check your `eas.json` build profile configuration
- Verify channel-branch linking with `eas channel:list`

#### **"Update failed to publish"**

- Check your internet connection
- Verify you're logged into EAS CLI (`eas whoami`)
- Check for syntax errors in your code

### 🔍 **Debugging Commands**

```bash
# Check all channels and their linked branches
eas channel:list

# Check all branches and their updates
eas branch:list

# View specific update details
eas update:view [update-id]

# Check your EAS login status
eas whoami
```

---

## Best Practices

### ✅ **Do's**

1. **Always test on dev first**

   ```bash
   npm run update:dev "Test message"
   ```

2. **Use descriptive update messages**

   ```bash
   npm run update:alpha "Fixed login bug - users can now sign in"
   ```

3. **Keep updates small and focused**

   - One feature per update
   - Easier to rollback if needed

4. **Monitor your updates**
   - Check `eas update:list` regularly
   - Monitor user feedback

### ❌ **Don'ts**

1. **Don't skip testing**

   - Always test on dev before alpha
   - Always test on alpha before production

2. **Don't push untested code to production**

   - Use the three-tier system properly

3. **Don't ignore update messages**
   - Clear messages help with debugging

### 🎯 **Update Message Format**

Follow this format for consistency:

```
TYPE: Brief description

Examples:
- "FIX: Fixed expense calculation bug"
- "FEATURE: Added dark mode support"
- "UPDATE: Improved performance"
- "HOTFIX: Critical login issue resolved"
```

---

## Quick Reference

### 📋 **Command Cheat Sheet**

```bash
# Update Commands
npm run update:dev "Message"        # → Development users
npm run update:alpha "Message"      # → Alpha testers
npm run update:production "Message" # → Production users
npm run update                      # → Auto (uses git branch)

# Build Commands - Development
npm run build:dev:ios               # → iOS development build
npm run build:dev:android           # → Android development build
npm run build:dev:all               # → Both platforms

# Build Commands - Alpha
npm run build:alpha:ios             # → iOS alpha build (TestFlight)
npm run build:alpha:android         # → Android alpha build
npm run build:alpha:all             # → Both platforms

# Build Commands - Production
npm run build:production:ios        # → iOS production build (App Store)
npm run build:production:android    # → Android production build (Play Store)
npm run build:production:all        # → Both platforms

# Submit Commands
npm run submit:production:ios        # → Submit iOS to App Store
npm run submit:production:android    # → Submit Android to Play Store
npm run submit:alpha:ios             # → Submit iOS to TestFlight
npm run submit:alpha:android         # → Submit Android for internal testing
npm run testflight                   # → Build + Submit iOS to TestFlight

# Inspection Commands
eas channel:list                     # → See all channels
eas branch:list                      # → See all branches
eas update:list                      # → See recent updates
```

### 🔗 **Useful Links**

- [EAS Update Documentation](https://docs.expo.dev/eas-update/)
- [EAS CLI Reference](https://docs.expo.dev/eas-update/eas-cli/)
- [Build Configuration](https://docs.expo.dev/build/introduction/)

---

## 🎉 You're Ready!

Now you understand how EAS Update works in our Travel Cost App. Remember:

1. **Channels** = Who gets the update
2. **Branches** = What updates are available
3. **Build Profiles** = Which channel your build connects to
4. **Always test** before pushing to production

Happy updating! 🚀
