---
task: m-fix-login-flickering
branch: fix/login-flickering
status: pending
created: 2025-09-12
modules: [authentication, login-flow, ui-rendering]
---

# Fix Login Flickering

## Problem/Goal
Fix the flickering issue that occurs during the login email input process. The UI elements are flickering or rendering inconsistently when users interact with the email input field.

## Success Criteria
- [ ] Identify root cause of flickering during email input
- [ ] Fix rendering or state management issues causing flicker
- [ ] Ensure smooth user experience during login process
- [ ] Test on different devices and screen sizes
- [ ] Verify no performance regression
- [ ] Test with different keyboard types and input methods

## Context Manifest

### How Login Email Input Currently Works: Authentication Flow Architecture

The login email input flickering occurs within a complex authentication flow that involves multiple layers of state management, network monitoring, and UI rendering patterns. When a user begins typing in the email input field, several systems are actively monitoring and updating state in parallel, creating potential for UI flickering.

The authentication flow starts with the `LoginScreen.tsx` component, which establishes a sophisticated context monitoring system. The screen simultaneously watches multiple context providers: `AuthContext`, `UserContext`, `TripContext`, `NetworkContext`, and `ExpensesContext`. Most critically for the flickering issue, the `LoginScreen` maintains its own local `isConnected` state that derives from `netCtx.isConnected && netCtx.strongConnection`, and this state is updated via a `useEffect` hook that triggers every time the network context changes.

The `NetworkContextProvider` runs a continuous polling system every 5 seconds (`DEBUG_POLLING_INTERVAL = 5000`) via the `useInterval` hook. This polling performs network speed tests through `isConnectionFastEnough()` and updates two separate state values: `isConnected` and `strongConnection`. These state updates propagate through the context system and trigger re-renders in consuming components, including the `LoginScreen`.

When the user interacts with the email input field, the following cascade occurs: The input field is rendered within `AuthContent.tsx`, which uses a `KeyboardAvoidingView` with platform-specific behavior and keyboard offset calculations using `useHeaderHeight()`. Inside this, `AuthForm.tsx` renders the actual `Input.tsx` component for the email field. The `Input` component includes a conditional "clear input" button (`clearInput`) that is dynamically rendered based on `value && value.length > 0`. This conditional rendering creates and destroys UI elements as the user types, particularly problematic when the first character is entered or the last character is deleted.

The email input value is managed through `enteredEmail` state in `AuthForm`, which updates via `updateInputValueHandler` bound to the "email" input type. Every character typed triggers `setEnteredEmail(enteredValue)`, which causes the `Input` component to re-render and recalculate the `clearInput` conditional rendering. Simultaneously, the `isConnected` state from the network polling can change during typing, causing the parent `LoginScreen` to re-render and pass updated `isConnected` props down to `AuthContent` and `AuthForm`.

The styling system adds another layer of complexity through `dynamicScale()` calculations that are performed on every render. The scaling function calls `Dimensions.get("window")` on each invocation and performs orientation-dependent calculations, device type detection, and moderation factor applications. The `Input` component uses multiple `dynamicScale()` calls for dimensions, fonts, and spacing, meaning every network-induced re-render recalculates all these values.

The rendering hierarchy becomes problematic because network state updates (every 5 seconds) can coincide with user input events, causing the entire component tree to re-render while the user is actively typing. The `KeyboardAvoidingView` recalculates its positioning, the dynamic scaling recalculates dimensions, and the conditional "clear input" button toggles visibility state.

### For New Feature Implementation: Fixing Login Flickering Root Causes

To fix the login flickering, we need to address three primary architectural sources of unnecessary re-renders during email input:

**Network State Optimization**: The current network monitoring system triggers re-renders on the entire `LoginScreen` every 5 seconds due to the `useEffect` dependency on `[netCtx.isConnected, netCtx.strongConnection]`. During active typing, these network updates cause the authentication form to re-render unnecessarily. We need to implement a memoization strategy for the `isConnected` state or debounce network updates when user input is active.

**Conditional Rendering Stabilization**: The `clearInput` button in `Input.tsx` uses inline conditional rendering that creates and destroys DOM elements as the user types. This pattern `{clearInput}` where `clearInput` is calculated on every render creates flickering when transitioning between empty and non-empty input states. We need to consistently render the button element and control its visibility through opacity or similar stable styling approaches.

**Dynamic Scaling Memoization**: The `dynamicScale()` function performs expensive calculations on every render, including `Dimensions.get("window")`, device detection, and orientation checks. During network-induced re-renders while typing, these calculations repeat unnecessarily. We need to memoize these calculations or move them outside the render cycle.

**KeyboardAvoidingView Stabilization**: The `AuthContent` component's `KeyboardAvoidingView` recalculates `keyboardVerticalOffset` and behavior on every render due to the `Platform.select()` calls and `useHeaderHeight()` dependency. When network state changes trigger parent re-renders, the keyboard handling logic recalculates positioning even when the keyboard state hasn't changed.

The architectural solution will involve implementing `useMemo`, `useCallback`, and `React.memo` patterns strategically throughout the authentication component hierarchy. We'll need to stabilize the network state updates during active input sessions, memoize the dynamic scaling calculations, and ensure conditional UI elements maintain stable DOM presence rather than mounting/unmounting repeatedly.

The fix must preserve the existing authentication flow behavior while eliminating the render cascades that cause flickering. This includes maintaining the network connection feedback to users (the button color changes based on connection state) while preventing those updates from disrupting active input sessions.

### Technical Reference Details

#### Component Hierarchy & Interfaces

**LoginScreen.tsx (Root Authentication Screen)**
```typescript
// Main dependencies causing re-renders
const netCtx = useContext(NetworkContext);
const [isConnected, setIsConnected] = useState(netCtx.isConnected && netCtx.strongConnection);

// Problematic useEffect triggering re-renders every 5 seconds
useEffect(() => {
  setIsConnected(netCtx.isConnected && netCtx.strongConnection);
}, [netCtx.isConnected, netCtx.strongConnection]);

// Props passed down
<AuthContent isLogin isConnected={isConnected} onAuthenticate={loginHandler} />
```

**AuthContent.tsx (KeyboardAvoidingView Container)**
```typescript
function AuthContent({ isLogin, onAuthenticate, isConnected }) {
  // Recalculated on every render
  const headerHeight = useHeaderHeight();
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ android: undefined, ios: "position" })}
      keyboardVerticalOffset={Platform.select({ android: headerHeight, ios: 0 })}
    >
      <AuthForm isLogin={isLogin} isConnected={isConnected} onSubmit={submitHandler} />
    </KeyboardAvoidingView>
  );
}
```

**AuthForm.tsx (Form State Management)**
```typescript
// State causing input re-renders
const [enteredEmail, setEnteredEmail] = useState("");

// Update handler recreated on every render
function updateInputValueHandler(inputType, enteredValue) {
  switch (inputType) {
    case "email": setEnteredEmail(enteredValue); break;
    // ...
  }
}

// Problematic binding creating new function references
<Input
  onUpdateValue={updateInputValueHandler.bind(this, "email")}
  value={enteredEmail}
  isInvalid={emailIsInvalid}
/>
```

**Input.tsx (Flickering Source)**
```typescript
// Conditional rendering causing DOM mount/unmount
const clearInput = value && value.length > 0 && (
  <TouchableOpacity onPress={() => onUpdateValue("")}>
    <Text>X</Text>
  </TouchableOpacity>
);

// Dynamic scaling recalculated on every render
style={[
  styles.input,
  isInvalid && styles.inputInvalid,
  { minWidth: "95%" }, // Dynamic percentage calculation
]}

// Conditional JSX causing flicker
{clearInput}
```

#### Network Context Polling Pattern

**NetworkContextProvider.tsx**
```typescript
// 5-second polling interval
export const DEBUG_POLLING_INTERVAL = 5000;

// Triggers state updates every 5 seconds
useInterval(() => {
  async function asyncCheckConnectionSpeed() {
    const { isFastEnough, speed } = await isConnectionFastEnough();
    setStrongConnection(isFastEnough); // Causes consumer re-renders
  }
  asyncCheckConnectionSpeed();
}, DEBUG_POLLING_INTERVAL, true);
```

#### Dynamic Scaling Calculations

**scalingUtil.ts**
```typescript
// Called multiple times per render cycle
const dynamicScale = (size: number, vertical = false, moderateFactor: number = null) => {
  const { width, height } = Dimensions.get("window"); // Expensive call
  const isPortrait = width < height; // Recalculated
  const isATablet = isTablet(); // Device detection
  // Complex calculations...
  return returnSize;
};
```

#### File Locations for Implementation

**Primary Files to Modify:**
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/screens/LoginScreen.tsx` - Network state memoization
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/Auth/AuthContent.tsx` - KeyboardAvoidingView stabilization  
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/Auth/AuthForm.tsx` - Callback memoization
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/Auth/Input.tsx` - Conditional rendering fixes

**Supporting Files to Consider:**
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/util/scalingUtil.ts` - Scaling optimization
- `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/store/network-context.tsx` - Polling pattern review

#### Configuration Requirements

**No environment variable changes required** - this is a pure UI optimization task that doesn't affect external integrations or API calls.

**Testing Requirements:**
- Test on iOS and Android devices with different screen sizes
- Test with slow/unstable network conditions to verify network polling doesn't interfere
- Test rapid typing in email field to verify no character loss
- Test keyboard appearance/dismissal during email input
- Test form validation states during typing
- Verify clear button functionality remains intact

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
FIX: flickering during login email input

## Work Log
<!-- Updated as work progresses -->