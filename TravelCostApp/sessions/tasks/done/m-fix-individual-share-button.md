---
task: m-fix-individual-share-button
branch: fix/individual-share-button
status: pending
created: 2025-09-18
modules: [components/ManageExpense, components/TravellerDropdown]
---

# Fix Individual Share Button in Expense Edit Modal

## Problem/Goal
Individual share button next to travellerDropdown in expense edit modal (manageExpense) does not work. Need to investigate and fix the button functionality.

## Success Criteria
- [ ] Investigate why individual share button is not working
- [ ] Fix button click handling and functionality
- [ ] Test individual share button in expense edit modal
- [ ] Verify button integrates properly with traveller dropdown
- [ ] Ensure consistent behavior across different expense types

## Context Manifest

### How This Currently Works: Expense Sharing and Modal State Machine

When a user creates or edits an expense in the ManageExpense screen, they encounter a sophisticated modal state machine that manages expense sharing flows. The system was recently enhanced (commits 64f10ec and f3a84f7) to improve the UX for adding travellers and managing complex sharing scenarios.

The expense form (`ExpenseForm.tsx:107-2499`) implements a modal state machine pattern with four distinct states: `NONE`, `WHO_PAID`, `HOW_SHARED`, and `EXACT_SHARING`. This state machine manages cascading modal flows where selecting certain options in one modal automatically opens the next relevant modal after a 100ms delay for smooth transitions.

The individual share button in question is the `people-circle-outline` IconButton located at lines 1585-1627 in `ExpenseForm.tsx`. This button is positioned next to the "Who Paid" dropdown and serves as a quick shortcut to set up individual (exact) expense sharing. When pressed, it should:

1. Set the split type to "EXACT"
2. Calculate equal splits for all current travellers
3. Set the payer to the current user
4. Validate the split list
5. Update the UI to show individual amount inputs for each traveller

The button's onPress handler (lines 1603-1626) calls `calcSplitList()` with `tempSplitType: "EXACT"`, passes the current amount, user, and travellers list. If splits are successfully calculated, it updates `splitType`, `splitList`, and `splitListValid` state using the respective setters.

The traveller data comes from `TripContext.travellers` and is transformed using `travellerToDropdown(currentTravellers, true)` which includes an "+ add traveller" option. The dropdown integrates with the modal state machine - when "__ADD_TRAVELLER__" is selected, it navigates to the Share screen for inviting new travellers.

After the individual share button sets up exact splitting, users see a horizontal FlatList (lines 1867-2023) displaying individual input fields for each traveller's share amount. Each item in this list shows the traveller's name, an editable amount field, the currency symbol, and a remove button ("x"). The split amounts automatically recalculate when the total expense amount changes, maintaining proportional distribution.

The validation system (`validateSplitList()` from `util/split.ts`) ensures split amounts add up correctly to the total expense amount. When splits are invalid, a red recalculation button appears (lines 1081-1126) allowing users to auto-fix discrepancies.

Currency conversion is handled automatically - if the expense currency differs from the trip currency, both the original and converted amounts are displayed for each split, with exchange rates stored in each split object.

### For New Feature Implementation: Debugging the Individual Share Button

Since the individual share button is reportedly not working, the issue likely lies in one of several integration points in the current modal state machine and expense sharing flow.

The button depends on several state variables and functions working correctly. The `amountValue` must be valid and non-zero, `currentTravellers` must be populated from TripContext, and the `calcSplitList()` function must successfully return split objects. The button is only rendered when `!IsSoloTraveller` is true (checking `currentTravellers?.length === 1`).

Common failure points include: the `loadingTravellers` state blocking traveller data, network connectivity affecting `TripContext.travellers` population, or validation failures in `calcSplitList()` when traveller data is malformed. The recent modal state machine changes may have introduced timing issues where state updates conflict with the button's immediate calculations.

The modal state machine transitions might be interfering with the button's functionality. Since the button should work independently of the modal flow (it doesn't use `modalFlow` state), but it's positioned within the same area as the WHO_PAID dropdown which does use the modal flow, there could be event handling conflicts or state interference.

The fix will likely involve debugging the button's onPress handler to identify which step is failing, ensuring proper traveller data is available, validating the `calcSplitList()` function receives correct parameters, and confirming the state updates (`setSplitType`, `setSplitList`, `setSplitListValid`) are executing properly.

### Technical Reference Details

#### Component Location & Integration
- File: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/ManageExpense/ExpenseForm.tsx`
- Button implementation: Lines 1585-1627
- Modal state machine: Lines 578-631
- Split list rendering: Lines 1867-2023

#### Key State Variables
```typescript
const [splitType, setSplitType] = useState<splitType>("SELF");
const [splitList, setSplitList] = useState(editingValues ? editingValues.splitList : []);
const [splitListValid, setSplitListValid] = useState(true);
const [currentTravellers, setCurrentTravellers] = useState(tripCtx.travellers);
const [modalFlow, setModalFlow] = useState(modalStates.NONE);
```

#### Critical Functions
```typescript
// From util/split.ts
calcSplitList(splitType: splitType, amount: number, whoPaid: string, splitTravellers: string[])
validateSplitList(splitList: Split[], splitType: splitType, amount: number)
travellerToDropdown(travellers, includeAddTraveller = true)

// Button's onPress handler logic
const tempSplitType: splitType = "EXACT";
const listSplits = calcSplitList(tempSplitType, +amountValue, userCtx.userName, currentTravellers);
```

#### Data Flow Dependencies
- TripContext.travellers → currentTravellers state
- currentTravellers → calcSplitList() → splitList state
- splitList + splitType → validateSplitList() → splitListValid state
- amountValue (from form input) must be valid number > 0
- userCtx.userName must be available as the payer

#### Modal State Machine
```typescript
const modalStates = {
  NONE: "none",
  WHO_PAID: "whoPaid",
  HOW_SHARED: "howShared",
  EXACT_SHARING: "exactSharing",
};
```

#### Button Rendering Conditions
- Only shows when `!IsSoloTraveller` (i.e., `currentTravellers?.length > 1`)
- Only shows when `showWhoPaid` is true (i.e., `amountValue !== ""`)
- Located within whoPaidContainer but should work independently of dropdown

#### Recent Changes Context
- Commit 64f10ec: Added share trip to traveller dropdown functionality
- Commit f3a84f7: Implemented modal state machine for cascading flows
- These changes may have introduced timing or state conflicts affecting the button

## User Notes
Individual share button next to traverllerDropdown in expense edit modal (manageExpense) does not work.

## Work Log
- [2025-09-18] Created task