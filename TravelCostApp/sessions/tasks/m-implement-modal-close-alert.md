---
task: m-implement-modal-close-alert
branch: feature/implement-modal-close-alert
status: pending
created: 2025-09-18
modules: [components/modals, components/forms]
---

# Add Alert Before Closing Modals With Input

## Problem/Goal
Currently, modals containing input fields (expense edit, trip edit) can be closed without warning, potentially losing user input. This creates a poor user experience and could result in data loss.

## Success Criteria
- [ ] Alert dialog appears when user attempts to close modal with unsaved input
- [ ] Alert provides options to save, discard, or cancel close action
- [ ] Modal cannot be closed without the alert showing if there's unsaved input
- [ ] Works for expense edit modal
- [ ] Works for trip edit modal
- [ ] Works for all modal close methods (back button, gesture, overlay tap)

## Context Manifest

### How Modal Dismissal Currently Works: ManageExpense and ManageTrip Screens

When a user opens the expense edit modal (`ManageExpense` screen) or trip edit modal (`TripForm` component), the modal is presented using React Navigation's modal presentation style (`presentation: "modal"` in App.tsx:199 and App.tsx:224). The current dismissal mechanism works through several pathways:

**Navigation-Based Dismissal:**
- **Back Button (iOS)**: `BackButton` component (components/UI/BackButton.tsx:15-18) calls `navigation.goBack()` directly without any confirmation
- **Cancel Button**: `ExpenseForm` receives an `onCancel` prop that calls `navigation.goBack()` from the parent `ManageExpense` screen (screens/ManageExpense.tsx:254-256)
- **Form Submission**: After successful submission, both components call `navigation.popToTop()` to return to the main screen

**Hardware/Gesture Dismissal:**
- **Android Hardware Back**: Currently handled by React Navigation's default behavior - no custom interception
- **iOS Swipe Gesture**: Modal can be dismissed via swipe-down gesture with no intervention
- **Modal Backdrop**: Not applicable as these are full-screen modal presentations

**Current Form State Management:**
The `ExpenseForm` maintains complex state in `useState` hooks (components/ManageExpense/ExpenseForm.tsx:153-196) including amount, description, category, currency, date ranges, split configurations, and traveller selections. The `TripForm` similarly tracks trip name, budget, currency, dates, and dynamic budget settings (components/ManageTrip/TripForm.tsx:96-117).

**State Persistence Patterns:**
The expense form implements sophisticated state preservation when navigating to category selection (ExpenseForm.tsx:364-434), storing form values in `tempValues` and restoring them upon return. This indicates the codebase already has patterns for detecting and managing unsaved form state.

**Existing Alert Patterns:**
The codebase extensively uses `Alert.alert()` for confirmation dialogs. Key examples include:
- Expense deletion confirmation (ManageExpense.tsx:178-251) with yes/no options
- Trip currency change confirmation (TripForm.tsx:523-540)
- Form validation alerts (TripForm.tsx:410-440) for invalid inputs
- Range vs split expense decisions (ExpenseForm.tsx:529-552) with custom actions

**Modal Implementation Architecture:**
Both screens use React Navigation's native stack navigator with modal presentation. However, some modals in the codebase also use `react-native-modal` library (as seen in TripForm.tsx:639-649) which provides more granular control over modal behavior including `onBackdropPress`, `onBackButtonPress`, and `onSwipeComplete` handlers.

### For New Feature Implementation: Modal Close Alert Integration

Since we're implementing close alerts for modals with unsaved input, the solution needs to integrate with React Navigation's modal dismissal lifecycle and the existing form state management patterns.

**Form State Change Detection:**
The implementation will need to track whether form inputs have been modified from their initial state. For `ExpenseForm`, this means comparing current input state against `defaultValues` (for editing) or empty state (for new expenses). For `TripForm`, comparison should be against loaded trip data or initial values.

**Navigation Interception:**
React Navigation provides navigation lifecycle events that can be intercepted. The implementation should use `navigation.addListener('beforeRemove')` to detect when the modal is about to be dismissed and show the alert if there are unsaved changes.

**Alert Implementation Pattern:**
Following the existing codebase patterns, the alert should use `Alert.alert()` with three options:
1. "Save" - trigger form submission
2. "Discard" - allow dismissal without saving
3. "Cancel" - prevent dismissal and return to form

**Integration Points:**
- `ManageExpense.tsx:254-256` - Modify `cancelHandler` to check for unsaved changes
- `ExpenseForm.tsx:107-119` - Add unsaved changes detection logic
- `TripForm.tsx:237-239` - Modify `cancelHandler` with change detection
- Navigation listeners need to be added to both screen components

**Existing Modal Patterns to Follow:**
The `react-native-modal` usage in TripForm (lines 645-648) shows the proper pattern for handling multiple dismiss triggers: `onBackdropPress={handleClose}`, `onBackButtonPress={handleClose}`, `onSwipeComplete={handleClose}`. The new implementation should intercept all these pathways.

### Technical Reference Details

#### Component Interfaces & Signatures

```typescript
// ExpenseForm props interface
interface ExpenseFormProps {
  onCancel: () => void;           // Called when user cancels
  onSubmit: (data: ExpenseData) => Promise<void>;
  isEditing: boolean;
  defaultValues?: ExpenseData;
  navigation: NavigationProp;
}

// TripForm navigation patterns
navigation.goBack();              // Current cancel behavior
navigation.popToTop();            // Post-submission navigation
navigation.addListener('beforeRemove', handler); // Interception point

// Form state structure (ExpenseForm)
const [inputs, setInputs] = useState({
  amount: { value: string, isValid: boolean },
  description: { value: string, isValid: boolean },
  // ... other form fields
});

// Alert pattern used throughout codebase
Alert.alert(title, message, [
  { text: "Cancel" },
  { text: "Discard", onPress: () => confirmDismiss() },
  { text: "Save", onPress: () => handleSave() }
]);
```

#### Data Structures

**Form State Change Detection:**
```typescript
// Compare current state vs initial state
const hasUnsavedChanges = () => {
  return Object.keys(inputs).some(key =>
    inputs[key].value !== initialValues[key]?.value
  );
};

// For TripForm
const hasUnsavedChanges = () => {
  return inputs.tripName.value !== (editingValues?.tripName || "") ||
         inputs.totalBudget.value !== (editingValues?.totalBudget || "");
};
```

**Navigation Event Handling:**
```typescript
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!hasUnsavedChanges()) return; // Allow dismissal

    e.preventDefault(); // Prevent dismissal
    showCloseAlert();   // Show confirmation
  });

  return unsubscribe;
}, [navigation, hasUnsavedChanges]);
```

#### File Locations

- Implementation for ExpenseForm: `components/ManageExpense/ExpenseForm.tsx:107-119`
- Implementation for TripForm: `components/ManageTrip/TripForm.tsx:237-239`
- Cancel handler updates: `screens/ManageExpense.tsx:254-256`
- Navigation configuration: `App.tsx:195-225` (modal presentation settings)
- Alert pattern examples: `screens/ManageExpense.tsx:178-251`

## User Notes
<!-- Any specific notes or requirements from the developer -->

## Work Log
<!-- Updated as work progresses -->
- [YYYY-MM-DD] Started task, initial research