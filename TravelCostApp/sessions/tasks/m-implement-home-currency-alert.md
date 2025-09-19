---
task: m-implement-home-currency-alert
branch: feature/implement-home-currency-alert
status: pending
created: 2025-09-18
modules: [components/TripForm, utils/currency]
---

# Alert and Auto-fill for Trip Home Currency

## Problem/Goal
Need to alert users if they put anything different than their home currency into trip home currency field AND auto-fill this field with home currency by default.

## Success Criteria
- [ ] Alert appears when user enters different currency than home currency
- [ ] Trip home currency field auto-fills with user's home currency
- [ ] Clear messaging about currency mismatch implications
- [ ] User can override the auto-fill if needed
- [ ] Validate currency selection logic

## Context Manifest

### How Trip Currency Selection Currently Works: TripForm Component

When a user creates a new trip through the TripForm component (`components/ManageTrip/TripForm.tsx`), the app automatically determines their home currency from device locale settings. This process starts when the TripForm loads:

1. **Locale-based Currency Detection**: The app uses `expo-localization` to get the user's device locales and extracts the currency code from the first locale (`const currencyList = locales.map((locale) => locale.currencyCode)` line 73). This becomes the `standardCurrency` (line 74) which represents the user's expected home currency.

2. **Initial Form State**: The trip currency field is pre-populated with this `standardCurrency` in the form inputs state (line 106: `value: standardCurrency`). This means new trips automatically start with the user's home currency as the default.

3. **Currency Selection Flow**: The currency picker is only shown for new trips (not when editing - see line 602-622). Users can change this via the CurrencyPicker component which displays a searchable modal with countries, their currencies, and currency symbols. The picker uses the `country-to-currency` and `i18n-iso-countries` libraries to map countries to currencies.

4. **Currency Change Confirmation**: When users select a different currency, the `updateCurrency()` function (line 521-540) shows a confirmation alert asking "Are you sure you want to change the currency? It should be set to the currency you are using normally at home." This suggests the app already considers the trip currency as the user's "home currency" conceptually.

5. **Form Validation**: The `checkFormValidity()` function (line 379-441) validates that a trip currency is selected, but there's no validation comparing it against the user's actual home currency preference.

6. **User Preference Storage**: The UserContext maintains `lastCurrency` and `lastCountry` preferences (stored in secure storage), but these track the last used values rather than a permanent home currency setting. The `standardCurrency` from locale is recalculated each time rather than being stored as a user preference.

### Current Currency Management Architecture

The app has several currency-related systems that need coordination:

**Locale-based Detection**: The `standardCurrency` is derived fresh from device locale each time TripForm loads. This assumes the user's device locale correctly represents their home currency, but users may travel internationally or have devices configured differently than their actual home currency preference.

**User Context Preferences**: The UserContext stores `lastCurrency` and `lastCountry` but these are "last used" values, not home currency preferences. They're loaded from secure storage and used to remember the user's most recent selections across sessions.

**Trip Currency Storage**: Each trip stores its own `tripCurrency` in the TripData interface. Multiple trips can have different currencies, and the app handles currency conversion in some areas (like TripSummaryScreen line 163-165 shows a TODO for currency conversion).

**CurrencyPicker Component**: This component (`components/Currency/CurrencyPicker.tsx`) provides a searchable interface for selecting currencies by country. It shows currency codes, symbols, and country names in the user's language. It validates selections and provides haptic feedback.

### For New Feature Implementation: Home Currency Alert and Auto-fill

Since we're implementing a home currency alert and auto-fill system, we need to enhance the existing architecture at several integration points:

**User Preference Storage Enhancement**: We need to add a persistent "home currency" preference to the UserContext, distinct from `lastCurrency`. This should be stored in secure storage and represent the user's actual home currency preference rather than just their last selection.

**TripForm Integration**: The form initialization logic needs modification to check if the selected trip currency differs from the stored home currency preference. If it does, we should show an alert and offer to auto-correct it.

**Alert Implementation**: We can leverage the existing Alert pattern seen in the `updateCurrency()` function, but need to create a new alert specifically for home currency mismatch detection. The app already has an Alert utility (`components/Errors/Alert.tsx`) with `alertYesNo` function for confirmation dialogs.

**Auto-fill Logic**: The auto-fill should set the trip currency to the user's home currency preference when the form loads, but allow override. The existing `inputChangedHandler` function (line 229-236) can be used to programmatically set the currency value.

**Settings Integration**: Users should be able to view and modify their home currency preference in the Settings screen. The app already has settings infrastructure with SettingsSection components and user preference management.

### Technical Reference Details

#### Component Interfaces & Signatures

**TripForm Currency State**:
```typescript
const [inputs, setInputs] = useState({
  tripCurrency: {
    value: standardCurrency,  // Auto-filled from locale
    isValid: true,
  }
});

function inputChangedHandler(inputIdentifier: string, enteredValue: any)
function updateCurrency() // Existing confirmation dialog
```

**UserContext Interface**:
```typescript
interface UserData {
  lastCurrency?: string;  // Last used currency
  lastCountry?: string;   // Last used country
  // Need to add: homeCurrency?: string;
}

// Available methods:
setLastCurrency: (string: string) => void
loadLastCurrencyCountryFromStorage: () => Promise<void>
```

**CurrencyPicker Interface**:
```typescript
interface CurrencyPickerProps {
  countryValue: string;
  setCountryValue: (value: string) => void;
  onChangeValue: () => void;
  placeholder?: string;
  valid?: boolean;
}
```

#### Data Structures

**Trip Currency Storage**:
- `TripData.tripCurrency: string` - Stored per trip
- Validated in `checkFormValidity()` for existence
- Used throughout app for expense calculations and display

**User Preference Storage**:
- Secure storage keys: `"lastCurrency"`, `"lastCountry"`
- Need to add: `"homeCurrency"` key for persistent preference
- Storage pattern: `secureStoreSetItem(key, value)` / `secureStoreGetItem(key)`

**Locale Detection**:
```typescript
const locales = Localization.getLocales();
const currencyList = locales.map((locale) => locale.currencyCode);
const standardCurrency = currencyList[0]; // Device locale currency
```

#### Configuration Requirements

**Internationalization**:
- Alert messages need i18n keys in `supportedLanguages.tsx`
- Existing patterns: `infoHomeCurrencyTitle`, `infoHomeCurrencyText`
- Need new keys for mismatch alerts and confirmation dialogs

**User Experience**:
- Alert should be informative, not intrusive
- Auto-fill should be obvious but overrideable
- Settings should allow users to modify home currency preference
- Should integrate with existing tour guide system for feature discovery

#### File Locations

- **Implementation goes here**: `components/ManageTrip/TripForm.tsx` (alert logic)
- **Related configuration**: `store/user-context.tsx` (home currency preference)
- **Settings integration**: `screens/SettingsScreen.tsx` (user preference management)
- **Internationalization**: `i18n/supportedLanguages.tsx` (alert text)
- **Alert utilities**: `components/Errors/Alert.tsx` (reusable alert functions)

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
Alert if a user puts anything different than his home currency into trip home currency AND auto-fill this field with home currency.

## Work Log
- [2025-09-18] Created task