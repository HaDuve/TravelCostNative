---
task: m-implement-trip-edit-skeleton
branch: feature/implement-trip-edit-skeleton
status: pending
created: 2025-09-18
modules: [components/ManageTrip, components/ui]
---

# Improve ManageTrip Edit Modal Loading Times with Skeleton Component

## Problem/Goal
ManageTrip edit modal has bad loading times. Need to add reusable skeleton component and use it to load rest of UI faster, improving perceived performance.

## Success Criteria
- [ ] Create reusable skeleton component
- [ ] Implement skeleton loading state in ManageTrip edit modal
- [ ] Improve perceived loading performance
- [ ] Test loading improvements on various devices
- [ ] Ensure skeleton matches final UI layout

## Context Manifest

### How ManageTrip Edit Modal Currently Works

When a user navigates to edit a trip (via the "ManageTrip" screen), the request flows through several key components in a specific sequence. The entry point is the TripForm component (`components/ManageTrip/TripForm.tsx:69-973`), which serves as both a trip creation and editing modal. This component is registered as a stack screen in the navigation system (`App.tsx` line ~ManageTrip screen definition) with `headerShown: false` for a custom header experience.

The loading sequence begins when the component mounts with editing parameters. If `route.params?.tripId` exists, the component enters editing mode (`TripForm.tsx:161-162`). The initial loading state is managed by a `isLoading` state variable (`TripForm.tsx:85`) that starts as `false` but gets set to `true` during data fetching operations.

The critical loading bottleneck occurs in the `useLayoutEffect` hook (`TripForm.tsx:164-219`). When editing a trip, the component first attempts to load data from the TripContext cache (`loadTripDataFromContext` function, lines 187-204). If the current trip in context doesn't match the edited trip ID, it sets `isLoading` to `true` and calls `fetchTripData` (lines 165-185). This async function performs a network request to `fetchTrip(editedTripId)` and then sequentially updates all the input states:

- Trip name via `inputChangedHandler("tripName", selectedTrip.tripName)`
- Currency via `inputChangedHandler("tripCurrency", selectedTrip.tripCurrency)`
- Daily budget, total budget, dynamic budget flag
- Start/end dates via `setStartDate` and `setEndDate`
- Travellers list via `setTravellers`

Each input change triggers a re-render because `inputChangedHandler` calls `setInputs` with a new object (`TripForm.tsx:229-235`). Only after ALL data is loaded does `setIsLoading(false)` get called (line 185), revealing the form.

During this loading period, the entire form UI is replaced with a `LoadingBarOverlay` component (`TripForm.tsx:661-672`). This overlay displays a progress bar, activity indicator, and localized text ("loadingYourTrip"). The loading experience is jarring because users see a completely blank screen with just a loading indicator, then suddenly the full form appears all at once.

The form UI itself is quite complex, featuring multiple input sections wrapped in an animated container (`TripForm.tsx:682-691` with `FadeInDown.duration(300)` entry animation). The main form elements include:

- Trip name input (always visible)
- Currency picker (only for new trips, hidden during editing)
- Total budget input with recalculation buttons
- Daily budget input with conditional visibility based on dynamic budget toggle
- Dynamic budget switch with info modals
- Date picker with range selection
- Action buttons (save/cancel/set active)

The architectural pattern shows that trip data flows through multiple context providers (`TripContext`, `AuthContext`, `UserContext`, `ExpensesContext`) and the component manages complex validation logic, currency handling, and budget calculations. The form uses React Native Reanimated for animations (`FadeInDown`, `FadeOut`, `ZoomIn`, `ZoomOut`) and implements a comprehensive modal system for info displays.

The performance issue stems from the "all-or-nothing" loading approach. Users experience a completely blank loading state, then suddenly see the full form. This pattern violates progressive loading best practices and creates poor perceived performance.

### For New Skeleton Implementation: What Needs to Connect

Since we're implementing a skeleton loading system to improve perceived performance, it will need to integrate with the existing loading flow while providing visual continuity. The skeleton should mimic the final form layout to create a seamless transition from loading state to populated content.

The skeleton component will need to replace the current `LoadingBarOverlay` usage in the `isLoading` conditional render block (`TripForm.tsx:661-672`). Instead of showing a generic loading overlay, we'll display placeholder elements that match the exact layout structure of the form. This requires understanding the form's visual hierarchy:

1. **Card Container**: The main form is wrapped in a styled card (`styles.card` - lines 1022-1034) with background color `GlobalStyles.colors.gray500`, border radius 10, and specific margin/padding
2. **Title Section**: Large title text (`styles.title` - lines 1045-1052) centered with font size `dynamicScale(24)` and bold weight
3. **Input Sections**: Multiple input groups, each with labels and text input areas following the pattern from `components/ManageExpense/Input.tsx`
4. **Currency Picker**: Conditional section only visible during trip creation
5. **Budget Inputs**: Two related inputs with recalculation buttons and info buttons
6. **Dynamic Switch**: Toggle section with label and switch component
7. **Date Picker**: Date range selection component with specific styling
8. **Button Row**: Action buttons at bottom with specific spacing

The skeleton needs to seamlessly integrate with the existing animation system. The current form uses `Animated.View` with `FadeInDown.duration(300)` for entry animation. Our skeleton should also use these animations for consistency, appearing with the same `FadeInDown` animation when `isLoading` is true, then transitioning out (possibly with `FadeOut`) when real content loads.

The loading state management will need modification. Instead of the binary `isLoading` state, we might introduce a more granular state system:

- `isLoading: true` → Show skeleton with `FadeInDown` animation
- Data fetched but inputs not yet populated → Continue showing skeleton
- All inputs populated → Transition from skeleton to real form with coordinated animations

The skeleton must respect the existing responsive design patterns. The app uses `dynamicScale` utility (`util/scalingUtil`) throughout for responsive sizing. Our skeleton placeholders need to use the same scaling functions to match the final form dimensions across different screen sizes.

Integration with the existing UI component patterns is crucial. The app has established loading patterns through `LoadingOverlay.tsx` and `LoadingBarOverlay.tsx` that use `react-native-paper`'s `ActivityIndicator` and `react-native-progress` for progress bars. Our skeleton should potentially build upon these existing patterns while providing the structured placeholder approach.

The skeleton will need to handle the conditional rendering logic that exists in the form. For example, the currency picker section is only shown for new trips (`!isEditing`), and the daily budget input is conditionally hidden when dynamic budget mode is enabled. The skeleton should match these conditional states to provide accurate layout preview.

For styling consistency, the skeleton should use the same global styles system (`constants/styles.ts`) that provides colors like `GlobalStyles.colors.gray500` for backgrounds, `GlobalStyles.colors.textColor` for text, and the established shadow/elevation patterns. The skeleton elements should use placeholder colors that fit within this design system - likely using lighter variants of the existing grays for placeholder backgrounds and shimmer effects.

### Technical Reference Details

#### Component Integration Points

**TripForm.tsx Key Methods & Data Flow:**
```typescript
// Current loading state management
const [isLoading, setIsLoading] = useState(false);

// Data fetching pattern that triggers loading
useLayoutEffect(() => {
  const fetchTripData = async () => {
    // Network request - this is the slow part
    const selectedTrip = await fetchTrip(editedTripId);
    // Sequential state updates - each triggers re-render
    inputChangedHandler("tripName", selectedTrip.tripName);
    inputChangedHandler("tripCurrency", selectedTrip.tripCurrency);
    // ... more sequential updates
    setIsLoading(false); // Finally hide loading
  };
}, [editedTripId, isEditing, ...deps]);

// Current loading render - needs replacement
if (isLoading) {
  return (
    <LoadingBarOverlay
      customText={i18n.t("loadingYourTrip")}
      containerStyle={GlobalStyles.wideStrongShadow}
      progress={loadingProgress == 0 ? null : loadingProgress / 9}
      barWidth={windowWidth * 0.8}
    />
  );
}
```

**Input Component Interface (`components/ManageExpense/Input.tsx`):**
```typescript
interface InputProps {
  label: string;
  style?: object;
  textInputConfig: {
    onChangeText: (value: string) => void;
    value: string;
    keyboardType?: string;
  };
  invalid: boolean;
  autoFocus?: boolean;
  inputStyle?: any;
  placeholder?: string;
  editable?: boolean;
}
```

#### Form Layout Structure

**Main Form Container:**
- Card wrapper: `styles.card` with gray500 background, 10px border radius, 4% margin/padding
- Min height: 80% for editing, 70% for new trips
- Shadow: elevation 3, shadow offset (4,4), gray600 shadow color

**Title Section:**
- Font size: `dynamicScale(24)` with bold weight
- Color: `GlobalStyles.colors.textColor` (#434343)
- Margins: top `dynamicScale(5)`, bottom `dynamicScale(24)`
- Text alignment: center

**Input Layout Pattern:**
- Container: `styles.inputContainer` with `dynamicScale(16)` horizontal margin
- Label: 12pt font size with `GlobalStyles.colors.textColor`
- Input: gray500 background, 6pt padding, primary700 text color
- Invalid state: error50 background with error500 label color

**Button Areas:**
- Button container: flex row, space-around alignment, 4% top margin
- Individual buttons: minimum 35% width
- Special gradient buttons for primary actions

#### Animation System Integration

**Current Animations (react-native-reanimated):**
```typescript
import Animated, { FadeInDown, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

// Main form entry animation
<Animated.View
  entering={FadeInDown.duration(300)}
  exiting={FadeOut}
>
  {/* form content */}
</Animated.View>

// Conditional element animations (recalc buttons)
<Animated.View entering={ZoomIn} exiting={ZoomOut}>
  {/* recalculation buttons */}
</Animated.View>
```

#### Styling System Details

**Global Colors Available:**
- Background: `#F8F8F8` (backgroundColor)
- Card background: `#DCDCDC` (gray500)
- Text: `#434343` (textColor)
- Primary: `#538076` (primary500)
- Borders: `#BFBFBF` (gray600)
- Error states: `#B42113` (error500), `#fcc4e4` (error50)

**Scaling Utilities:**
- `dynamicScale(value, isHeight, factor)` - responsive sizing
- `constantScale(value, factor)` - fixed scaling
- All measurements should use these for consistency

#### Data Dependencies

**Context Requirements:**
- `TripContext`: Current trip data, tripid matching
- `AuthContext`: User authentication state (uid)
- `UserContext`: Username and trip history
- `NetworkContext`: Connection state for offline handling

**API Integration:**
- `fetchTrip(tripId)` returns TripData object with all form fields
- `updateTrip(tripId, tripData)` for saving changes
- Network state checking via `netCtx.isConnected && netCtx.strongConnection`

#### File Locations

**Implementation locations:**
- New skeleton component: `components/UI/TripFormSkeleton.tsx`
- Modified TripForm: `components/ManageTrip/TripForm.tsx` (lines 661-672 replacement)
- Style definitions: Add to existing `constants/styles.ts` or component-local styles
- Types/interfaces: If needed, add to existing component or create `types/skeleton.ts`

**Testing locations:**
- Component tests: `__tests__/components/UI/TripFormSkeleton.test.tsx`
- Integration tests: Modify existing `__tests__/components/ManageTrip/TripForm.test.tsx`
- Visual regression: Include in screenshot testing suite

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
Add reusable skeleton component and use it to load rest UI faster for ManageTrip edit modal.

## Work Log
- [2025-09-18] Created task