# Build Pipeline Documentation

This document provides a comprehensive guide for building and deploying the TravelCostApp using our custom build pipeline, replacing the previous Expo EAS (Expo Application Services) setup.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Build Scripts](#build-scripts)
- [Platform-Specific Requirements](#platform-specific-requirements)
- [Troubleshooting](#troubleshooting)
- [Migration from EAS](#migration-from-eas)

## Prerequisites

### System Requirements

- **Node.js**: Version 18+ (recommended: 20.x)
- **Package Manager**: pnpm (preferred) or npm
- **Operating System**: macOS (for iOS builds), macOS/Linux/Windows (for Android builds)

### Required Tools

#### For All Platforms

```bash
# Install Node.js dependencies
pnpm install

# Install Expo CLI globally
npm install -g @expo/cli

# Install Fastlane for app store submissions
gem install fastlane
```

#### For Android Development

```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set up Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Install Java Development Kit (JDK) 17+
# macOS: brew install openjdk@17
# Ubuntu: sudo apt install openjdk-17-jdk
```

#### For iOS Development

```bash
# Install Xcode from Mac App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Ruby via Homebrew (recommended over system Ruby)
brew install ruby

# Add Homebrew Ruby to your PATH
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Install CocoaPods and Fastlane
gem install cocoapods
gem install fastlane
```

**Note**: Using Homebrew Ruby instead of system Ruby avoids permission issues and provides better dependency management.

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd TravelCostApp

# Install dependencies
pnpm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Android Signing (Required for production builds)
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
ANDROID_KEY_ALIAS=your_key_alias

# Branch.io Integration
BRANCH_LIVE_KEY=your_branch_live_key
BRANCH_TEST_KEY=your_branch_test_key
BRANCH_TEST_MODE=false

# Google Play Console (for submissions)
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json

# Optional: Custom paths
ANDROID_KEYSTORE_PATH=./android/app/release.keystore
```

### 3. Android Keystore Setup

For production Android builds, you need a release keystore that matches the one used for previous Google Play Console uploads:

```bash
# IMPORTANT: Use the original keystore that matches Google Play Console expectations
# The keystore must have the correct SHA1 fingerprint that Google Play Console expects

# Check available keystore files
ls -la *.jks *.keystore

# Use the original keystore (e.g., @haduve__Travel-Expense.jks)
# Update .env file with correct keystore path and password
ANDROID_KEYSTORE_PATH=./@haduve__Travel-Expense.jks
ANDROID_KEYSTORE_PASSWORD=your_original_password
ANDROID_KEY_PASSWORD=your_original_password
ANDROID_KEY_ALIAS=your_original_alias

# Verify the keystore SHA1 fingerprint matches Google Play Console
keytool -list -v -keystore @haduve__Travel-Expense.jks -storepass your_password | grep SHA1
```

**⚠️ Critical**: The keystore SHA1 fingerprint must match what Google Play Console expects. If you get a signing error, you're using the wrong keystore or password.

### 4. iOS Code Signing

1. Open `ios/Budget.xcworkspace` in Xcode
2. Select the project and go to "Signing & Capabilities"
3. Ensure your Apple Developer account is configured
4. Set the correct Team ID: `AK62F8767Z`
5. Bundle Identifier: `com.budgetfornomads.app`

## Build Scripts

### Development Builds

Development builds are optimized for testing and debugging:

```bash
# Build for all platforms
pnpm run build:dev

# Build for specific platform
pnpm run build:dev android
pnpm run build:dev ios

# Build and install on connected device
pnpm run build:dev android --install
```

**Output:**

- **Android**: APK file at `android/app/build/outputs/apk/debug/app-debug.apk`
- **iOS**: Simulator build (use `npx expo run:ios` to run)

### Production Builds

Production builds are optimized for app store distribution:

```bash
# Build for all platforms
pnpm run build:prod

# Build for specific platform
pnpm run build:prod android
pnpm run build:prod ios
```

**Output:**

- **Android**: AAB file at `android/app/build/outputs/bundle/release/app-release.aab`
- **iOS**: IPA file at `ios/build/export/Budget.ipa`

### App Store Submissions

Submit production builds to app stores:

```bash
# Submit to all stores
pnpm run submit:prod

# Submit to specific store
pnpm run submit:prod android
pnpm run submit:prod ios
```

### Manual Testing Commands

After successful builds, use these commands to test your builds manually:

#### **📱 Android Development Build**

```bash
# Rebuild Android development APK
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
pnpm run build:dev android

# Install APK on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or install via ADB
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Output Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

#### **🍎 iOS Development Build**

```bash
# Rebuild iOS simulator build
export LANG=en_US.UTF-8
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
pnpm run build:dev ios

# Run on iOS Simulator
npx expo run:ios --simulator
```

**Output Location**: Built in Xcode DerivedData (simulator-ready)

#### **📱 Android Production Build**

```bash
# Rebuild Android production AAB
export LANG=en_US.UTF-8
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
pnpm run build:prod android
```

**Output Location**: `android/app/build/outputs/bundle/release/app-release.aab`
**Size**: ~98.94 MB
**Status**: ✅ **READY FOR GOOGLE PLAY STORE**

#### **🍎 iOS Production Build**

```bash
# Rebuild iOS production IPA
export LANG=en_US.UTF-8
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
pnpm run build:prod ios
```

**Output Location**: `ios/build/export/Budget.ipa`
**Status**: ✅ **READY FOR APP STORE**

#### **🔧 Environment Setup for Manual Testing**

```bash
# Set up complete environment (run before any build commands)
export LANG=en_US.UTF-8
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verify environment
java -version
adb version
xcodebuild -version
```

#### **📋 Build Verification Checklist**

- [ ] Android APK builds successfully
- [ ] Android AAB builds successfully
- [ ] iOS simulator build completes
- [ ] iOS IPA builds successfully
- [ ] All builds are properly signed
- [ ] Build outputs are in correct locations
- [ ] File sizes are reasonable (APK ~250MB, AAB ~100MB)

## Platform-Specific Requirements

### Android

#### Build Configuration

- **Package Name**: `com.budgetfornomads.app`
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Build Tools**: 34.0.0
- **Compile SDK**: 34

#### Key Features

- Hermes JavaScript engine enabled
- New Architecture enabled
- ProGuard minification for release builds
- Branch.io deep linking integration
- Support for GIF and WebP images

#### Build Process

1. Clean previous builds
2. Generate release AAB with signing
3. Optimize and minify code
4. Create Android App Bundle for Play Store

### iOS

#### Build Configuration

- **Bundle ID**: `com.budgetfornomads.app`
- **Deployment Target**: iOS 15.1+
- **Xcode Version**: 15.0+
- **Hermes**: Enabled
- **New Architecture**: Disabled (compatibility with current setup)

#### Key Features

- CocoaPods dependency management
- App Store Connect integration
- Push notification support
- Branch.io deep linking integration

#### Build Process

1. Install CocoaPods dependencies
2. Archive the app for distribution
3. Export IPA with App Store configuration
4. Validate and prepare for submission

## Troubleshooting

### Common Issues

#### Android Build Failures

**Issue**: Gradle build fails with "SDK location not found"

```bash
# Solution: Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Issue**: Keystore not found

```bash
# Solution: Ensure keystore exists and path is correct
ls -la android/app/release.keystore
```

**Issue**: Build fails with "Could not find method android()"

```bash
# Solution: Clean and rebuild
cd android && ./gradlew clean && cd ..
pnpm run build:prod android
```

#### iOS Build Failures

**Issue**: Pod install fails

```bash
# Solution: Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

**Issue**: Code signing errors

```bash
# Solution: Check Xcode signing configuration
# Open ios/Budget.xcworkspace in Xcode
# Go to Signing & Capabilities tab
# Ensure correct Team ID and Bundle ID
```

**Issue**: Archive fails with "No such file or directory"

```bash
# Solution: Clean build folder
cd ios
rm -rf build
xcodebuild clean -workspace Budget.xcworkspace -scheme Budget
cd ..
```

**Issue**: Gem install fails with permission errors

```bash
# Error: You don't have write permissions for /Library/Ruby/Gems/2.6.0
# Solution: Use Homebrew Ruby instead of system Ruby

# Install Homebrew Ruby
brew install ruby

# Add to PATH
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Now install gems without sudo
gem install cocoapods fastlane
```

#### General Issues

**Issue**: Node modules not found

```bash
# Solution: Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue**: Metro bundler cache issues

```bash
# Solution: Clear Metro cache
npx expo start --clear
```

### Debug Mode

Enable verbose logging for debugging:

```bash
# Android
DEBUG=1 pnpm run build:dev android

# iOS
DEBUG=1 pnpm run build:dev ios
```

### Performance Optimization

#### Android

- Enable ProGuard for release builds
- Use AAB instead of APK for Play Store
- Optimize images and assets

#### iOS

- Enable bitcode (if supported by dependencies)
- Use App Store distribution profile
- Optimize for App Store review guidelines

## Migration from EAS

### What Changed

1. **Build System**: Replaced EAS Build with local Gradle/Xcode builds
2. **Dependencies**: Removed dependency on Expo's cloud services
3. **Scripts**: New custom build scripts in `scripts/` directory
4. **Configuration**: Updated `package.json` scripts

### Migration Steps

1. **Backup Current Setup**

   ```bash
   git checkout -b backup-eas-setup
   git add . && git commit -m "Backup EAS configuration"
   ```

2. **Update Dependencies**

   ```bash
   pnpm install
   ```

3. **Set Up Environment**

   - Create `.env` file with required variables
   - Generate Android keystore
   - Configure iOS code signing

4. **Test Builds**

   ```bash
   # Test development build
   pnpm run build:dev

   # Test production build
   pnpm run build:prod
   ```

5. **Update CI/CD** (if applicable)
   - Update build scripts in your CI/CD pipeline
   - Ensure environment variables are set
   - Update deployment steps

### Rollback Plan

If you need to rollback to EAS:

1. Revert package.json scripts
2. Restore eas.json configuration
3. Remove custom build scripts
4. Reinstall EAS CLI: `npm install -g @expo/eas-cli`

## Support

For issues or questions:

1. Check this documentation first
2. Review the troubleshooting section
3. Check build logs for specific error messages
4. Ensure all prerequisites are installed correctly

## Script Reference

### build-dev.js

- **Purpose**: Development builds for testing
- **Platforms**: Android (APK), iOS (Simulator)
- **Usage**: `node scripts/build-dev.js [platform] [--install]`

### build-prod.js

- **Purpose**: Production builds for app stores
- **Platforms**: Android (AAB), iOS (IPA)
- **Usage**: `node scripts/build-prod.js [platform]`

### submit-prod.js

- **Purpose**: Submit builds to app stores
- **Platforms**: Google Play Console, App Store Connect
- **Usage**: `node scripts/submit-prod.js [platform]`

---

_Last updated: January 27, 2025_
_Version: 1.0.0_
