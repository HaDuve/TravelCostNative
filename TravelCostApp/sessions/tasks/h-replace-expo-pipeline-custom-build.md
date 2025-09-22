---
task: h-replace-expo-pipeline-custom-build
branch: feature/replace-expo-pipeline
status: pending
created: 2025-01-27
modules: [build-system, deployment, android, ios, eas-config, package-scripts]
---

# Replace Expo Pipeline with Custom Build and Submit Scripts

## Problem/Goal

Replace the current Expo EAS (Expo Application Services) pipeline with custom build and submit scripts to have more control over the build process, reduce dependency on Expo services, and create a more streamlined development workflow with `build:dev`, `build:prod`, and `submit:prod` commands.

## Success Criteria

- [ ] Create `build:dev` script for development builds (emulators/local devices)
- [ ] Create `build:prod` script for production builds (emulators/local devices)
- [ ] Create `submit:prod` script for app store submissions (iOS App Store + Google Play Store)
- [ ] Create comprehensive `pipeline.md` documentation with:
  - [ ] Complete setup guide for new developers
  - [ ] All script commands and their usage
  - [ ] Prerequisites and environment setup
  - [ ] Step-by-step build instructions
  - [ ] Troubleshooting guide
  - [ ] Platform-specific requirements (iOS/Android)
- [ ] Remove or minimize dependency on EAS services
- [ ] Maintain existing app functionality and features
- [ ] Ensure builds work on both iOS and Android platforms
- [ ] Support both debug and release configurations
- [ ] Integrate with existing code signing and provisioning profiles
- [ ] Test builds on actual devices and emulators
- [ ] Document the new build process for team members

## Context Files

<!-- Added by context-gathering agent or manually -->

## User Notes

Replace expo pipeline with our own build and submit scripts. Ideally we want to achieve a build:dev build:prod (to install on emulators or local devices) and submit:prod (which sends builds to app store and google play store for test/review)

## Work Log

<!-- Updated as work progresses -->

- [2025-01-27] Created task for replacing Expo pipeline with custom build scripts
