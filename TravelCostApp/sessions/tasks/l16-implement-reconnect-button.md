---
task: m-implement-reconnect-button
branch: feature/reconnect-button
status: pending
created: 2025-09-12
modules: [network-connectivity, offline-handling, ui-components]
---

# Implement Reconnect Button

## Problem/Goal
Add a reconnect button to the custom "no internet" modal to allow users to manually retry network connections when they regain connectivity.

## Success Criteria
- [ ] Add reconnect button to existing "no internet" modal
- [ ] Implement button functionality to retry network requests
- [ ] Test button behavior when network is restored
- [ ] Ensure proper loading states during reconnection attempts
- [ ] Verify modal dismisses after successful reconnection
- [ ] Handle failed reconnection attempts gracefully
- [ ] Add proper translations for the reconnect button

## Context Manifest

### How Network Connectivity Currently Works: Connection Monitoring & Error Handling

When the app starts, the `NetworkContextProvider` component initializes a comprehensive network monitoring system that tracks both basic connectivity and connection quality. The system uses the `@react-native-community/netinfo` library to listen for network state changes and performs periodic speed tests to determine connection quality.

The network monitoring operates on multiple levels. First, `NetInfo.addEventListener()` provides real-time updates when the device's internet connectivity changes, updating the `isConnected` state based on `state.isInternetReachable`. Second, a custom speed testing mechanism runs at regular intervals (defined by `DEBUG_POLLING_INTERVAL`) that downloads a test file from "https://jsonplaceholder.typicode.com/todos" and calculates the connection speed in Mbps.

The connection quality is determined by comparing the measured speed against `MINIMUM_REQUIRED_SPEED` from app constants. This creates two distinct connectivity states: `isConnected` (basic internet availability) and `strongConnection` (fast enough for app operations). The app considers a connection "strong" only when both conditions are met.

Throughout the app, network-dependent operations check these connectivity states before proceeding. The pattern is consistent across all screens: components import the `NetworkContext`, destructure `isConnected` and `strongConnection`, then show `Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"))` when connectivity is insufficient.

Currently, when users encounter network issues, they receive a standard Alert dialog with localized messages. The dialog has an "OK" button that simply dismisses the alert, leaving users with no immediate way to retry the failed operation. Users must manually attempt the action again after improving their connection.

The app includes an offline queue system (`util/offline-queue.ts`) that stores failed network operations and automatically retries them when connectivity improves. However, this automatic retry happens in the background during the app's polling intervals - there's no user-initiated retry mechanism.

### For New Feature Implementation: Custom "No Internet" Modal with Reconnect Button

The current system shows "no internet" errors through standard Alert dialogs, but the task requires implementing a custom modal specifically for these scenarios. This modal will need to integrate with the existing network monitoring system while providing users with an immediate retry mechanism.

The custom modal should be triggered in the same scenarios where `Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"))` is currently shown. Instead of the standard alert, we'll display a modal that includes both the error message and a prominent "Reconnect" button.

The reconnect functionality will need to trigger the existing network checking mechanisms: calling `isConnectionFastEnough()` from `util/connectionSpeed.ts` to re-test both basic connectivity and connection speed. The button should show loading states during the reconnection attempt and either dismiss the modal on success or show an error state on failure.

Since the app already has a robust network context and offline queue system, the reconnect button primarily needs to provide immediate user feedback and trigger re-evaluation of network state, rather than rebuilding the underlying connectivity infrastructure.

The modal should follow the app's existing design patterns found in other modal screens like `ManageExpense` (which uses `presentation: "modal"` in navigation options) and use the established button components (`GradientButton`, `FlatButton`) for consistency.

### Technical Reference Details

#### Network Context Interface
```typescript
// From store/network-context.tsx
export const NetworkContext = createContext({
  isConnected: boolean,
  strongConnection: boolean, 
  lastConnectionSpeedInMbps: number,
});
```

#### Connection Testing Function
```typescript
// From util/connectionSpeed.ts
export async function isConnectionFastEnough(): Promise<ConnectionSpeedResult> {
  // Returns: { isFastEnough: boolean, speed?: number }
}
```

#### Current Error Pattern (to be replaced)
```typescript
// Pattern used throughout app
import { Alert } from "react-native";
if (!isConnected) {
  Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
  return;
}
```

#### Button Components Available
- `GradientButton`: Primary actions with haptic feedback and gradients
- `FlatButton`: Secondary actions with simple styling  
- `Button`: Standard button with press animations

#### Localization Keys for Reconnect Feature
Need to add new keys to `i18n/supportedLanguages.tsx`:
- Existing: `noConnection`, `checkConnectionError`
- New needed: `reconnect`, `reconnecting`, `retryConnection`, etc.

#### Modal Implementation Pattern
```typescript
// Following pattern from App.tsx navigation
<Stack.Screen
  name="ReconnectModal" 
  component={ReconnectModal}
  options={{
    headerShown: false,
    presentation: "modal",
  }}
/>
```

#### File Locations
- Custom modal component: `/components/UI/ReconnectModal.tsx`
- Update translations: `/i18n/supportedLanguages.tsx`
- Integration points: All screens/components currently using `Alert.alert(i18n.t("noConnection")...)`
- Navigation registration: `/App.tsx` (if modal approach used)
- Alternative overlay approach: Could be added to existing screens directly

#### Integration Strategy
Replace existing `Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"))` calls with:
1. Navigation to custom modal screen, OR
2. State-managed overlay component that shows/hides based on network errors
3. Reconnect button triggers `isConnectionFastEnough()` and provides user feedback
4. Success dismisses modal and allows original operation to proceed
5. Failure shows retry state or additional error information

## User Notes
FEATURE: reconnect button in custom „no internet" modal

## Work Log
<!-- Updated as work progresses -->