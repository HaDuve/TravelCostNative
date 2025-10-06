---
task: h1-fix-android-startup-crash
branch: fix/android-startup-crash
status: pending
created: 2025-09-12
modules: [android-platform, app-initialization, dependencies]
---

# Fix Android Startup Crash

## Problem/Goal

Android app crashes on startup after recent library updates. Need to identify and fix compatibility issues or dependency conflicts causing the crash.

## Success Criteria

- [ ] Android app launches successfully without crashing
- [ ] Identify root cause of the startup crash
- [ ] Update or fix problematic libraries/dependencies
- [ ] Test on multiple Android devices and versions
- [ ] Ensure no regression in existing functionality

## Context Manifest

### How Android App Initialization Currently Works

When a user launches the Android app, the initialization process follows a complex sequence involving multiple native and JavaScript layers, with several potential crash points that have emerged from recent library updates.

**Android Native Initialization Flow:**
The app starts with `MainActivity.kt` which extends ReactActivity and initializes through several critical steps. First, the MainActivity calls `SplashScreenManager.registerOnActivity(this)` to handle the Expo splash screen, then calls `super.onCreate(null)` - notably passing null instead of the savedInstanceState Bundle, which is required for expo-splash-screen compatibility. The MainActivity is configured with `android:theme="@style/Theme.App.SplashScreen"` and multiple intent filters including custom schemes (`budgetfornomads`, `exp+travel-expense`).

The `MainApplication.kt` orchestrates the React Native initialization using Expo's `ReactNativeHostWrapper` pattern. Critical initialization includes `SoLoader.init(this, OpenSourceMergedSoMapping)` for native module loading, potential New Architecture initialization if `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` is true, and `ApplicationLifecycleDispatcher.onApplicationCreate(this)` for Expo module lifecycle management. The app has `newArchEnabled=true` in gradle.properties but `"newArchEnabled": false` in app.json, creating a potential configuration mismatch.

**JavaScript Initialization and Crash Points:**
The React application in `App.tsx` initializes through multiple provider layers in a specific order: AuthContextProvider → NetworkContextProvider → TripContextProvider → UserContextProvider → SettingsProvider → NetworkProvider → ExpensesContextProvider → OrientationContextProvider → GestureHandlerRootView → TourGuideProvider. Each provider can fail during initialization.

The `Root()` component performs a complex `onRootMount()` sequence that includes several high-risk operations: `handleFirstStart()` for first-run setup, conditional `asyncStoreSafeClear()` if DEBUG_RESET_STORAGE is true, connection speed testing via `isConnectionFastEnough()`, secure storage retrieval for authentication tokens, and critically, RevenueCat Purchases configuration with platform-specific API keys.

**RevenueCat Configuration Risk:**
The Purchases.configure() call is platform-specific and occurs early in initialization. For Android, it uses `REVCAT_G` key and sets `appUserID: storedUid`. The configuration includes `Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR)` (recently changed from verbose logging in commit ae62ad1) and `await Purchases.collectDeviceIdentifiers()`. This configuration can fail if the RevenueCat SDK has compatibility issues with React Native 0.79.5.

**React 19 Compatibility Issues:**
The app recently updated to React 19.0.0 with React Native 0.79.5, which represents an experimental and potentially unstable combination. React 19 includes breaking changes in concurrent features, automatic batching behavior, and event handling that may not be fully compatible with React Native 0.79.5. This combination affects multiple libraries including react-native-reanimated 3.19.1, react-navigation components, and gesture handling.

**Recent Library Changes Causing Potential Crashes:**
Recent commits show several critical changes: removal of the `openai` package from dependencies while still maintaining references in code, addition of `react-native-markdown-display` v7.0.2 which may have Android compatibility issues, and updates to ChatGPT integration that could cause initialization failures if API keys are missing or invalid.

**Branch SDK and Native Module Initialization:**
The app initializes `react-native-branch` for deep linking through `initBranch(navigation)` in the AuthenticatedStack. Branch SDK initialization includes `branch.setIdentity(storedUid)` and `branch.subscribe()` for link handling. The Branch SDK can crash during initialization if there are permission issues or SDK version incompatibilities with Android API levels.

**Android Build Configuration Issues:**
The Android build configuration shows several potential problems: `compileSdk` and `targetSdkVersion` using `rootProject.ext` values not explicitly shown, Hermes enabled (`hermesEnabled=true`) which can have React 19 compatibility issues, New Architecture partially enabled creating configuration conflicts, and multiple image format support (GIF, WebP) through Fresco library versions that may conflict.

**Gradle and Build System:**
The app uses Gradle 8.13 with React Native Gradle Plugin configuration. The build process includes Expo CLI bundling (`bundleCommand = "export:embed"`), custom React Native directory resolution, and autolinking through `autolinkLibrariesWithApp()`. Build failures can occur if dependency versions are incompatible or if the build cache is corrupted.

### For Android Startup Crash Fix Implementation

Since we're implementing an Android startup crash fix, the issue likely stems from one of several critical initialization points that have become unstable after recent library updates.

**Primary Crash Candidates:**
The React 19 + React Native 0.79.5 combination is experimental and likely causing crashes in the gesture handler, navigation, or animation systems. The concurrent features and automatic batching changes in React 19 may be triggering race conditions during app initialization that manifest as Android crashes.

RevenueCat Purchases configuration occurs very early in the initialization process and is platform-specific. The recent logging level change suggests there were already stability issues. The configuration requires valid API keys and can fail if the SDK version is incompatible with React Native 0.79.5.

The New Architecture configuration mismatch (enabled in gradle.properties but disabled in app.json) could cause native module initialization to fail, especially with libraries that have different code paths for Old vs New Architecture.

**React Native Reanimated 3.19.1 Compatibility:**
Reanimated is deeply integrated into the app through gesture handlers, animated components, and the TourGuide system. React 19's changes to concurrent features and the render cycle could cause Reanimated to crash during initialization, particularly on Android where the threading model is different from iOS.

**Expo Module System Conflicts:**
The app uses Expo SDK 53.0.20 with multiple Expo modules. Recent changes to Expo modules (expo-splash-screen, expo-updates, expo-modules-core) may have compatibility issues with React 19. The `ApplicationLifecycleDispatcher.onApplicationCreate()` call could fail if Expo modules haven't been properly initialized.

**Android-Specific Initialization Issues:**
Android has specific requirements for activity lifecycle management, splash screen handling, and native module initialization that may be failing. The MainActivity's `super.onCreate(null)` call and theme configuration could be causing crashes if the splash screen system isn't properly configured.

### Technical Reference Details

#### Critical Initialization Sequence

**MainActivity.kt Initialization:**

- `SplashScreenManager.registerOnActivity(this)` - Line 21
- `super.onCreate(null)` - Line 23
- Component name: "main" - Line 30
- New Architecture delegate with `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED` - Line 39

**MainApplication.kt Configuration:**

- `SoLoader.init(this, OpenSourceMergedSoMapping)` - Line 45
- New Architecture loading if enabled - Lines 46-48
- `ApplicationLifecycleDispatcher.onApplicationCreate(this)` - Line 50

#### Dependency Versions and Compatibility Matrix

**Critical Versions:**

- React: 19.0.0 (experimental with React Native)
- React Native: 0.79.5
- react-native-reanimated: 3.19.1
- react-native-gesture-handler: 2.24.0
- Expo SDK: 53.0.20
- react-native-purchases: 9.2.2

#### Android Build Configuration

**Build Variables:**

- compileSdk: `rootProject.ext.compileSdkVersion`
- minSdkVersion: `rootProject.ext.minSdkVersion`
- targetSdkVersion: `rootProject.ext.targetSdkVersion`
- versionCode: 101101
- versionName: "1.2.803"

**Critical Build Settings:**

- `newArchEnabled=true` in gradle.properties
- `hermesEnabled=true`
- `org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m`

#### File Locations for Implementation

**Primary Investigation Files:**

- Android configuration: `/android/app/build.gradle`
- Native entry points: `/android/app/src/main/java/com/budgetfornomads/app/MainActivity.kt`
- Native application: `/android/app/src/main/java/com/budgetfornomads/app/MainApplication.kt`
- Main app initialization: `/App.tsx`
- Error logging: `/util/error.ts`

**Dependency Configuration:**

- Package versions: `/package.json`
- Gradle properties: `/android/gradle.properties`
- Expo configuration: `/app.json`
- Android manifest: `/android/app/src/main/AndroidManifest.xml`

#### Crash Investigation Approach

**Step 1: Version Compatibility Audit**
First check React 19 compatibility with React Native 0.79.5 and all native dependencies. Look for known issues with react-native-reanimated, react-native-gesture-handler, and Expo modules in this combination.

**Step 2: Native Module Initialization**
Verify RevenueCat Purchases, Branch SDK, and Expo modules are properly initializing. Add error boundaries and detailed logging around these critical initialization points.

**Step 3: Build Configuration Alignment**
Resolve the New Architecture configuration mismatch between gradle.properties and app.json. Ensure all build settings are consistent and compatible.

**Step 4: Android-Specific Testing**
Test on multiple Android devices and API levels to identify device-specific or API-level-specific crashes. Pay special attention to Android 14+ devices where there may be new permission or lifecycle requirements.

## Context Files

<!-- Added by context-gathering agent or manually -->

## User Notes

FIX: fix android crash on startup (check libraries after last update)

## Work Log

<!-- Updated as work progresses -->
