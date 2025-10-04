---
task: m-implement-error-tracking-vexo
branch: feature/error-tracking-vexo
status: in-progress
created: 2025-09-12
modules: [error-tracking, analytics, vexo-integration]
---

# Implement Error Tracking with Vexo

## Problem/Goal
Add Vexo for session and error tracking in production to improve debugging and monitoring capabilities. Integrate the Vexo tracking library to capture errors and session data.

## Success Criteria
- [x] Install and configure Vexo tracking library
- [x] Implement session tracking for user interactions
- [ ] Set up error tracking for crash reporting
- [x] Configure production-only tracking (not in development)
- [ ] Test error reporting functionality
- [x] Verify session data collection works correctly

## Context Manifest

### How Error Handling Currently Works: TravelCost App Architecture

The TravelCost App is a React Native Expo-managed application that currently has a basic error handling system in place, but lacks comprehensive production error tracking and session monitoring. Understanding the current architecture is critical for properly integrating Vexo.

When the application starts, it initializes through the main `App.tsx` component which sets up a complex provider hierarchy including `AuthContextProvider`, `TripContextProvider`, `UserContextProvider`, and `NetworkContextProvider`. The app uses React Navigation with both stack and tab navigators, serving as an expense tracking application for travelers.

The current error handling system centers around a custom utility in `/util/error.ts` that provides the `safeLogError` function. This function accepts an error object, filename, and line number, then logs detailed error information to the console including stack trace parsing to extract file names and line numbers. The error handling is type-safe, handling Error objects, strings, and JSON serializable objects. Currently, these errors only go to console.error and are not captured or reported to any external service.

The app has environment detection capabilities through several mechanisms. The `confAppConstants.ts` file contains a `DEVELOPER_MODE` constant (currently set to false) that controls certain debug behaviors like rating prompts. The app uses Expo Constants and Device detection (`Device.isDevice`) to differentiate between physical devices and simulators. The build system (defined in `eas.json`) has separate profiles for development, preview, and production environments, with production builds removing console logs through Babel's transform-remove-console plugin.

For production deployment, the app already has sophisticated analytics integration through Branch.io for deep linking and attribution tracking. Branch events are logged throughout the application lifecycle including login events, purchase tracking, and referral attribution. The integration in `/components/Referral/branch.ts` shows how third-party analytics are properly initialized and events are tracked.

The application structure follows React Native best practices with comprehensive context management, secure storage through expo-secure-store, and offline capabilities via react-native-offline. The app uses Firebase for backend services and RevenueCat for subscription management, indicating that additional third-party integrations are well-supported in this architecture.

Error scenarios currently handled include network failures (with offline queue management), authentication errors (with proper user feedback via Toast messages), and general application errors (with fallback UI components like ErrorOverlay). However, these errors are not centrally tracked or reported to any crash reporting service.

### For Vexo Integration: What Needs to Connect

Since we're implementing Vexo error tracking, we need to integrate it carefully with the existing error handling and environment detection patterns. The integration will need to hook into several key points in the application lifecycle and error handling flow.

The existing `safeLogError` function in `/util/error.ts` serves as the perfect integration point. Rather than just logging to console, this function should be enhanced to also report errors to Vexo in production environments. This maintains the existing API while adding the tracking functionality. The function already extracts comprehensive error information including stack traces, which Vexo can use for better error reporting.

Environment detection for production-only tracking can leverage the existing patterns. We should use `Device.isDevice` to ensure we're on a real device (not simulator), and check the build environment through Expo Constants or create a new environment detection utility that hooks into the EAS build profiles. The `DEVELOPER_MODE` constant pattern could also be extended to include a `VEXO_TRACKING_ENABLED` flag.

The application initialization flow in `App.tsx` is where Vexo should be initialized. Specifically, it should be set up in the `Root` component's `useEffect` hook after the app determines it's in production mode and authentication is established. This follows the same pattern used for RevenueCat and Branch.io initialization.

Session tracking integration points include the app state change handlers (already implemented for rating prompts), authentication flow (login/logout events), and navigation events (screen changes). The existing `AppState` listener in the `Root` component can be extended to include Vexo session events.

For error reporting, we need to integrate with the existing error boundaries and the global error handler. The current error handling is scattered across various components using try-catch blocks that call `safeLogError`. By enhancing this central function, all errors will automatically flow through Vexo.

The offline capabilities of the app (via react-native-offline and offline queue management) need consideration. Vexo integration should queue error reports when offline and send them when connectivity is restored, similar to how the existing offline queue works for expense data.

User context that should be included in Vexo reports includes the authenticated user ID (available through AuthContext), current trip ID (from TripContext), and user locale/settings (from UserContext). This contextual information will make debugging much more effective.

### Technical Reference Details

#### Integration Points & Signatures

**Primary Integration Point:**
```typescript
// /util/error.ts - Enhanced function
export default function safeLogError(
  error: unknown,
  fileName = "",
  lineNumber = 0,
  additionalContext?: Record<string, any>
): string | undefined
```

**App Initialization:**
```typescript
// App.tsx - Root component useEffect hook
// Add Vexo initialization after line 659 (after loadKeys())
// Use existing environment detection pattern
```

**Environment Detection:**
```typescript
// Pattern to follow
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const isProduction = Constants.manifest?.releaseChannel === 'production';
const isDevice = Device.isDevice;
const shouldEnableVexo = isProduction && isDevice && !DEVELOPER_MODE;
```

#### Data Structures for Context

**User Context to Include:**
```typescript
interface VexoUserContext {
  userId?: string;        // From AuthContext.userId
  tripId?: string;        // From TripContext.currentTrip  
  locale?: string;        // From i18n.locale
  deviceId?: string;      // From Device info
  buildProfile?: string;  // From Constants
}
```

**Existing Error Structure:**
```typescript
// Current error handling preserves:
// - Error message and stack trace
// - File name and line number extraction  
// - Type-safe error object parsing
// - Console logging (keep in development)
```

#### Configuration Requirements

**Environment Variables:**
- Vexo API key/configuration (add to existing env.d.tsx)
- Environment detection flags
- Optional: Vexo endpoint configuration

**Build Configuration:**
- Production builds only (respect existing EAS build profiles)
- Integrate with existing Babel configuration for console removal

#### File Locations

**Primary Implementation:**
- `/util/error.ts` - Enhance existing error handler
- `/util/vexo-tracking.ts` - New: Vexo initialization and configuration
- `/types/env.d.tsx` - Add Vexo environment variables

**Integration Points:**
- `/App.tsx` - Vexo initialization in Root component
- `/confAppConstants.ts` - Add Vexo-related constants

**Testing Locations:**
- Error tracking can be tested using existing error scenarios
- Manual error triggers through the existing error handling patterns

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
FEATURE: add „vexo" for session and error tracking in production

Vexo: Use https://docs.vexo.co/features library for tracking

## Work Log
<!-- Updated as work progresses -->