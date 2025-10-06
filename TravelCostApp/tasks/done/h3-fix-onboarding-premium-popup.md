---
task: h3-fix-onboarding-premium-popup
branch: fix/onboarding-premium-popup
status: pending
created: 2025-09-12
modules: [onboarding, premium-features, popup-management]
---

# Fix Onboarding Premium Popup

## Problem/Goal

Prevent the premium add popup from showing during the onboarding guide. The popup interrupts the user experience and should not appear while users are being guided through the app setup process.

## Success Criteria

- [ ] Identify where premium popup is triggered during onboarding
- [ ] Implement logic to suppress popup during onboarding flow
- [ ] Ensure popup appears normally after onboarding is complete
- [ ] Test onboarding flow without popup interruptions
- [ ] Verify premium popup still functions in other contexts
- [ ] Test edge cases (incomplete onboarding, navigation away/back)

## Context Manifest

### How This Currently Works: Onboarding and Premium Popup System

When a user first launches the app, the system checks whether they should see the onboarding flow through the `shouldShowOnboarding()` function in `components/Rating/firstStartUtil.ts`. This function examines the "firstStart" timestamp stored in secure storage and returns true if the first start was less than one day ago, triggering the onboarding sequence.

The onboarding flow begins in `App.tsx` within the `NotAuthenticatedStack` component. When a new user is detected, the navigation automatically moves to the "Onboarding" screen, which renders `screens/OnboardingScreen.tsx`. This screen uses the `react-native-onboarding-swiper` library to display a three-step tutorial with illustrations and localized content. Upon completion (either "Done" or "Skip"), users are navigated to the "Signup" screen.

After successful signup, users are considered "freshlyCreated" (a boolean flag stored in both the UserContext state and AsyncStorage). The app's main Home component checks this flag and sets the initial tab to "Profile" instead of "RecentExpenses" for newly created users. This directs them immediately to the ProfileScreen where they set up their trip and profile information.

The premium popup system operates through the `BlurPremium` component located at `components/Premium/BlurPremium.tsx`. This component automatically renders a blur overlay with a premium upgrade prompt whenever:

1. The user is not a premium member (checked via `userCtx.checkPremium()`)
2. The component is mounted on a screen
3. Network connectivity is available

The BlurPremium component uses a focus effect hook that triggers an animated blur intensity increase when the screen gains focus. After a 600ms delay, it shows an animated card with a "Get Premium" button that navigates to the paywall screen.

Currently, BlurPremium is placed on several key screens including:

- `ManageCategoryScreen.tsx` (line 558) - when users try to manage custom categories
- Several expense statistics components (ExpenseCountries, ExpenseCurrencies, ExpenseTravellers) - though these are commented out
- FilteredExpenses, FinderScreen, and ChatGPTDealScreen - also commented out

The problem occurs because BlurPremium doesn't check for onboarding state. A freshly created user navigating through the app (especially to the ProfileScreen and related flows) can encounter this premium popup before they've completed their basic setup, disrupting the guided experience.

The app's state management for onboarding involves multiple flags:

- `shouldShowOnboarding()` - time-based check for displaying initial tutorial
- `freshlyCreated` - UserContext flag indicating new user status
- `needsTour` - UserContext flag for guided tour within the app
- Various secure storage items like "firstStart", "hadTour"

### For New Feature Implementation: Onboarding-Aware Premium Popup

To prevent the premium popup from appearing during onboarding, we need to modify the BlurPremium component to check for onboarding state before rendering. The component should be suppressed when:

1. User is in `freshlyCreated` state (accessible via UserContext)
2. User hasn't completed the guided tour (`needsTour` is true)
3. Recent first start (within the onboarding time window)

The fix should be implemented in the BlurPremium component itself rather than conditionally rendering it on each screen, ensuring consistent behavior across the entire app. The component already has access to UserContext for premium status checking, so we can extend this to check onboarding flags.

After onboarding completion (when `freshlyCreated` is set to false via `setFreshlyCreatedTo(false)`), the premium popup should resume normal behavior. This ensures users get the full onboarding experience without interruption while maintaining the premium upgrade prompts for established users.

### Technical Reference Details

#### Component Interfaces & Signatures

```typescript
// BlurPremium component props
interface BlurPremiumProps {
  canBack?: boolean; // Shows back button when true
}

// UserContext onboarding-related methods
interface UserContextType {
  freshlyCreated: boolean;
  setFreshlyCreatedTo: (bool: boolean) => Promise<void>;
  needsTour: boolean;
  setNeedsTour: (bool: boolean) => void;
  checkPremium: () => Promise<boolean>;
}

// FirstStartUtil functions
function shouldShowOnboarding(): Promise<boolean>;
function handleFirstStart(): Promise<void>;
```

#### Data Structures

```typescript
// UserData interface includes onboarding flags
interface UserData {
  uid?: string;
  userName?: string;
  freshlyCreated?: boolean;
  needsTour?: boolean;
  isPremium?: boolean;
  // ... other fields
}

// Storage keys for onboarding state
const STORAGE_KEYS = {
  firstStart: "firstStart", // timestamp
  freshlyCreated: "freshlyCreated", // boolean in AsyncStorage
  hadTour: "hadTour", // boolean in SecureStorage
};
```

#### Key Integration Points

- `components/Premium/BlurPremium.tsx:25-117` - Main component that needs modification
- `store/user-context.tsx:67-68,96,243-247` - freshlyCreated state management
- `components/Rating/firstStartUtil.ts:47-58` - onboarding time-based logic
- `App.tsx:372-375` - freshlyCreated usage for initial screen routing

#### File Locations

- Implementation: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/Premium/BlurPremium.tsx`
- Supporting utilities: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/Rating/firstStartUtil.ts`
- State management: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/store/user-context.tsx`
- Navigation flow: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/App.tsx`

## Context Files

<!-- Added by context-gathering agent or manually -->

## User Notes

FIX: premium add popup should not show during the onboarding guide

## Work Log

<!-- Updated as work progresses -->
