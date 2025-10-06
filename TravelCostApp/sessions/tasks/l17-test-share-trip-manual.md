---
task: m-test-share-trip-manual
branch: experiment/test-share-trip-manual
status: pending
created: 2025-09-12
modules: [share-trip, api-integration, manual-testing]
---

# Test Share Trip Manual

## Problem/Goal

Conduct manual end-to-end testing of the share trip functionality to verify API integration and business logic work correctly. This is a comprehensive UX test to ensure the feature functions as expected.

## Success Criteria

- [ ] Manual test of complete share trip flow from start to finish
- [ ] Verify API calls work correctly for sharing trips
- [ ] Test trip sharing permissions and access control
- [ ] Confirm shared trip data integrity
- [ ] Test edge cases (network failures, invalid data, etc.)
- [ ] Document any issues or unexpected behaviors
- [ ] Validate user experience and usability

## Context Manifest

### How Share Trip Currently Works: End-to-End Flow

When a user wants to share a trip, the flow begins from the TripForm component when in editing mode. The user accesses the share functionality through a "Share Trip" button (line 722-726 in TripForm.tsx) that calls the `onShare` function from ShareTrip.tsx with the current trip ID.

The sharing process involves multiple steps orchestrated through the `onShare` function (ShareTrip.tsx lines 17-76):

**Step 1: Authentication & Branch API Setup**
The function first loads the Branch.io API key using `loadKeys()` from PremiumConstants, specifically extracting the "BRAN" key. This is critical because Branch.io provides the deep linking infrastructure that allows shared links to properly redirect users to the correct trip within the app.

**Step 2: Deep Link Generation**
A Branch.io deep link is created by making a POST request to `https://api2.branch.io/v1/url` with specific parameters:

- `$deeplink_path`: Set to `join/{shareId}` format
- Tags include "appinvite" and the specific trip ID
- Channel and campaign are both set to "appinvite"

The Branch API responds with a shortened URL that contains all the necessary routing information. If the API call fails, the system falls back to a default invite link from localization (i18n.t("inviteLink")).

**Step 3: Native Share Interface**
Once the URL is generated, the system uses React Native's built-in Share API to present the native sharing interface. The share payload includes:

- A localized invite message (i18n.t("inviteMessage"))
- The generated Branch deep link URL

**Step 4: Haptic Feedback & Navigation**
The system provides haptic feedback using Expo Haptics and navigates back to the Profile screen after sharing.

### Deep Link Handling & Join Flow

The receiving end of the share functionality is handled through Branch.io integration (branch.ts lines 6-52):

**Deep Link Processing**
When the app launches via a shared link, the Branch subscriber (lines 12-51) processes the incoming parameters. If the link contains `$deeplink_path` starting with "join/", it extracts the trip ID and navigates to the "Join" screen with that ID as a parameter.

**Trip Joining Process (JoinTrip.tsx)**
The join flow supports two entry methods:

1. Direct deep link navigation (automatic trip ID extraction)
2. Manual trip ID/link input by the user

The core joining logic (lines 136-196):

1. **Connection Validation**: Checks network connectivity using NetworkContext
2. **Trip Data Fetching**: Calls `fetchTrip(tripid)` to retrieve trip details
3. **User Trip History Update**: Updates user's trip history either by storing new history (`storeTripHistory`) or updating existing (`updateTripHistory`)
4. **Context State Management**: Updates TripContext, UserContext, and ExpensesContext
5. **Traveller Registration**: Calls `putTravelerInTrip()` to add the user to the trip's traveller list
6. **Data Synchronization**: Fetches expenses, updates local storage (MMKV), and sets secure storage

### API Integration Patterns

The backend integration uses Firebase Realtime Database with the base URL `https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app`. Key API functions:

**Trip Operations (http.tsx)**:

- `storeTrip(tripData)`: POST to `/trips.json` - Creates new trips
- `fetchTrip(tripid)`: GET `/trips/{tripid}.json` - Retrieves trip data
- `updateTrip(tripid, tripData)`: PUT `/trips/{tripid}.json` - Updates existing trips

**Traveller Management**:

- `putTravelerInTrip(tripid, traveller)`: PUT to `/trips/{tripid}/travellers.json` - Adds users to trips
- `getTravellers(tripid)`: GET `/trips/{tripid}/travellers.json` - Retrieves trip participants
- `fetchTripsTravellers(tripid)`: Internal function for detailed traveller data

**Authentication & Security**:
All API calls include an authentication token via `getMMKVString("QPAR")` which contains the Firebase auth token in format `?auth={token}`. The token is set globally using `setAxiosAccessToken()`.

### Data Flow & State Management

**Trip Context Management**:
The TripContext provides centralized trip state management with key functions:

- `setCurrentTrip(tripid, tripData)`: Sets active trip and updates contexts
- `fetchAndSetTravellers(tripid)`: Syncs traveller list
- `saveTripDataInStorage(tripData)`: Persists to local storage

**Storage Architecture**:

- **Secure Storage**: Used for sensitive data like `currentTripId` and authentication tokens
- **MMKV Storage**: High-performance storage for frequently accessed data like expenses and trip data
- **AsyncStorage**: Backup storage for non-critical data

**Network Handling**:
The NetworkContext monitors connection quality and speed. Share/join operations require both connectivity (`isConnected`) and sufficient speed (`strongConnection`). Failed operations show localized error messages and provide retry mechanisms.

### Error Handling & Edge Cases

**Connection Failures**:

- Share operations check network connectivity before API calls
- Join operations validate connection speed using `isConnectionFastEnoughAsBool()`
- Failed shares show alert with localized error messages (`i18n.t("errorShareTripText")`)

**Invalid Trip IDs**:

- Join flow validates trip existence through `fetchTrip()` call
- Missing trips show alerts with trip ID for debugging
- Retry mechanisms allow users to attempt joining again

**Branch.io Failures**:

- Share falls back to App Store links if Branch API fails
- Deep link processing gracefully handles malformed URLs
- Non-branch links are detected and handled separately

### For Manual Testing Implementation: Integration Points

**Test Entry Points**:

- TripForm edit mode → Share button (line 719-727)
- Direct navigation to Join screen with test trip IDs
- Deep link simulation through Branch testing tools

**Key Validation Points**:

1. **API Integration**: Branch.io URL generation and deep link parsing
2. **Data Persistence**: Trip joining should update all relevant contexts and storage layers
3. **Network Resilience**: Share/join operations under various network conditions
4. **User Experience**: Haptic feedback, loading states, error messaging
5. **Cross-Platform**: iOS/Android share interface differences
6. **Localization**: All user-facing messages should respect device language settings

The share trip functionality is deeply integrated with the app's authentication, storage, and navigation systems, requiring comprehensive end-to-end testing to ensure all integration points work correctly.

### Technical Reference Details

#### Component Interfaces & Signatures

**ShareTrip Functions**:

```typescript
export async function onShare(shareId: string, navigation: any): Promise<void>;
```

**HTTP API Functions**:

```typescript
export async function storeTrip(tripData: TripData): Promise<string>;
export async function fetchTrip(tripid: string): Promise<TripData>;
export async function putTravelerInTrip(
  tripid: string,
  traveller: Traveller
): Promise<void>;
export async function getTravellers(tripid: string): Promise<TravellerNames>;
```

**Branch Integration**:

```typescript
export async function initBranch(navigation: any): Promise<void>;
```

#### Data Structures

**Trip Data Model**:

```typescript
interface TripData {
  tripName?: string;
  expenses?: ExpenseData[];
  totalBudget?: string;
  dailyBudget?: string;
  tripCurrency?: string;
  travellers?: Traveller[];
  tripid?: string;
  startDate?: string;
  endDate?: string;
  isDynamicDailyBudget?: boolean;
  categories?: Category[] | string;
}
```

**Traveller Model**:

```typescript
interface Traveller {
  userName: string;
  uid: string;
}
```

**Branch Deep Link Payload**:

```typescript
{
  branch_key: string,
  channel: "appinvite",
  campaign: "appinvite",
  tags: ["appinvite", tripId],
  $deeplink_path: `join/${tripId}`,
  data: { $deeplink_path: `join/${tripId}` }
}
```

#### Configuration Requirements

**Environment Variables/Keys** (loaded via PremiumConstants):

- `BRAN`: Branch.io API key for deep link generation

**Firebase Configuration**:

- Base URL: `https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app`
- Authentication via Firebase Auth tokens

**Storage Keys**:

- `currentTripId`: Secure storage for active trip
- `QPAR`: MMKV storage for authentication parameters
- `expenses`: MMKV storage for trip expenses
- `currentTrip`: MMKV storage for trip data

#### File Locations

**Core Implementation**:

- Share functionality: `/components/ProfileOutput/ShareTrip.tsx`
- Join functionality: `/screens/JoinTrip.tsx`
- Trip management: `/components/ManageTrip/TripForm.tsx`

**API Integration**:

- HTTP utilities: `/util/http.tsx`
- Branch integration: `/components/Referral/branch.ts`

**Context Management**:

- Trip context: `/store/trip-context.tsx`
- Auth context: `/store/auth-context.tsx`
- Network context: `/store/network-context.tsx`

**Localization**:

- Strings: `/i18n/supportedLanguages.tsx`

**Testing Focus Areas**:

- Navigation deep linking via App.tsx (lines 45-46, 169-174)
- State synchronization across contexts
- Network connectivity edge cases
- Cross-platform share interface behavior

## User Notes

UX test: share trip (manual end to end api&logic test)

## Work Log

<!-- Updated as work progresses -->
