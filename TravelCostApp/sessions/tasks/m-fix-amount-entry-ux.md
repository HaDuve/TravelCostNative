---
task: m-fix-amount-entry-ux
branch: fix/amount-entry-ux
status: pending
created: 2025-09-18
modules: [components/AmountInput, components/forms]
---

# Fix Amount Entry UX - Auto-select Text

## Problem/Goal
Amount entry starts with a 0, blocking input. Need to auto-select all amount text when field is focused to improve UX and allow immediate typing.

## Success Criteria
- [ ] Auto-select all text in amount input when focused
- [ ] Remove blocking behavior of initial "0" value
- [ ] Test input behavior across different devices
- [ ] Ensure smooth typing experience
- [ ] Verify numeric keyboard appears correctly

## Context Manifest

### How Amount Entry Currently Works: ExpenseForm Input Flow

When a user navigates to create a new expense, the flow begins in the ManageExpense screen which renders the ExpenseForm component. The amount input system has multiple layers of complexity designed to handle various expense entry scenarios.

**Initial State Setup:**
The amount input is initialized in ExpenseForm.tsx at line 153-157 within the `inputs` state object. For new expenses (not editing), `editingValues` is `undefined`, so the amount value starts as an empty string `""`. The initialization logic follows this pattern:
```typescript
amount: {
  value: editingValues ? editingValues.amount?.toString() : "",
  isValid: true,
},
```

**Input Component Architecture:**
The amount field uses the custom Input component (Input.tsx:13-116) which wraps React Native's TextInput. This component includes several key properties:
- `selectTextOnFocus={true}` by default (line 23, 48) - this should auto-select text when focused
- `autoFocus={!isEditing ?? false}` when creating new expenses (ExpenseForm.tsx:1370)
- `keyboardType="decimal-pad"` for numeric input (ExpenseForm.tsx:1364)

**Text Input Configuration:**
The ExpenseForm passes specific configuration to the Input component at lines 1363-1368:
```typescript
textInputConfig={{
  keyboardType: "decimal-pad",
  onChangeText: inputChangedHandler.bind(this, "amount"),
  value: inputs.amount.value,
}}
```

**Current UX Problem:**
Despite `selectTextOnFocus={true}` being set, users report that amount entry "starts with a 0, blocking input." This suggests either:
1. The selectTextOnFocus prop isn't working as expected on certain devices/platforms
2. Some state update is setting a "0" value after initialization
3. The decimal-pad keyboard behavior is interfering with text selection

**Input Change Handling:**
When users type, the `inputChangedHandler` function (lines 772-781) processes the input:
- Updates the inputs state via `setInputs`
- Triggers `autoCategory` for description-based category detection
- Triggers `autoExpenseLinearSplitAdjust` for split calculations
- The Input component also handles comma-to-period conversion for decimal inputs (Input.tsx:52-59)

**Related State Management:**
The amount value has additional complexity with temporary amount handling (lines 197-205) for the quick-sum feature, currency conversion calculations (lines 222-258), and validation during form submission (lines 930-933).

### For New Feature Implementation: Enhanced Text Selection UX

The issue is that while `selectTextOnFocus={true}` is already set, it's not providing the smooth UX expected. The solution needs to ensure that:

1. **Auto-selection works reliably** across different devices and React Native versions
2. **Initial "0" values are prevented** from blocking user input
3. **Focus behavior is optimized** for immediate typing

**Implementation Strategy:**
The fix should enhance the existing Input component's focus handling without disrupting the complex amount calculation logic already in place. Since the Input component already accepts `selectTextOnFocus` as a prop and sets it to `true` by default, we need to investigate why it's not working as expected.

**Platform Considerations:**
The codebase shows platform-specific handling in multiple places (e.g., `Platform.OS == "android"` checks in ExpenseForm). The text selection behavior may need platform-specific implementations for consistent UX.

**Testing Requirements:**
The implementation must preserve all existing functionality:
- Quick-sum feature (temp amount handling)
- Currency conversion calculations
- Split amount linear adjustments
- Form validation logic
- Auto-focus behavior for new expenses

### Technical Reference Details

#### Component Interfaces & Signatures

**Input Component (Input.tsx:13-25):**
```typescript
const Input = ({
  label,
  style,
  textInputConfig,
  invalid,
  autoFocus,
  inputStyle,
  inputAccessoryViewID,
  placeholder = "",
  editable = true,
  selectTextOnFocus = true,
  hasCurrency = false,
}) => { ... }
```

**ExpenseForm Amount Input Usage (ExpenseForm.tsx:1358-1371):**
```typescript
<Input
  inputStyle={[styles.amountInput, GlobalStyles.strongShadow]}
  label={i18n.t("priceIn") + getCurrencySymbol(inputs.currency.value)}
  textInputConfig={{
    keyboardType: "decimal-pad",
    onChangeText: inputChangedHandler.bind(this, "amount"),
    value: inputs.amount.value,
  }}
  invalid={!inputs.amount.isValid}
  autoFocus={!isEditing ?? false}
/>
```

#### Data Structures

**Amount Input State Structure:**
```typescript
inputs: {
  amount: {
    value: string, // "" for new expenses, editingValues.amount.toString() for editing
    isValid: boolean
  }
}
```

**TextInput Props (React Native):**
- `selectTextOnFocus`: boolean - Should select all text when input is focused
- `onFocus`: function - Called when input receives focus
- `autoFocus`: boolean - Should focus automatically when component mounts

#### Configuration Requirements

**Current Text Selection Setup:**
- Input component defaults `selectTextOnFocus={true}`
- React Native TextInput receives this prop at Input.tsx:48
- No platform-specific overrides currently implemented

#### File Locations

- **Primary Implementation**: `/components/ManageExpense/Input.tsx` (text input wrapper)
- **Amount Input Usage**: `/components/ManageExpense/ExpenseForm.tsx` (lines 1358-1371)
- **Input State Management**: `/components/ManageExpense/ExpenseForm.tsx` (lines 153-196)
- **Input Change Handler**: `/components/ManageExpense/ExpenseForm.tsx` (lines 772-781)
- **Screen Integration**: `/screens/ManageExpense.tsx` (ExpenseForm usage)

## User Notes
UX amount entry starts with a 0, blocking input -> autoselect all amount text.

## Work Log
- [2025-09-18] Created task