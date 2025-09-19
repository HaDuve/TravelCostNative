---
task: h-fix-sharing-trip-issues
branch: fix/sharing-trip-issues
status: pending
created: 2025-09-18
modules: [components/ShareTrip, utils/sharing]
---

# Fix Trip Sharing Issues

## Problem/Goal
Manual testing reveals that sharing trip sometimes does not work. Need to investigate and fix the underlying issues causing sharing failures.

## Success Criteria
- [ ] Manual test trip sharing functionality thoroughly
- [ ] Identify root causes of sharing failures
- [ ] Fix sharing mechanism issues
- [ ] Test sharing across different scenarios (different users, trip types)
- [ ] Verify sharing works consistently

## Context Manifest

### How Trip Sharing Currently Works: End-to-End Flow

When a user initiates trip sharing, there are currently three different entry points in the app, each with different implementation patterns and potential failure points. Understanding these flows is critical because sharing failures can occur at multiple stages in this complex pipeline.

**Entry Point 1: TripForm Share Button (Primary)**
The main sharing entry point is through the TripForm component when in editing mode. Users access a "Share Trip" button (TripForm.tsx line 720-727) that directly calls the exported `onShare` function from ShareTrip.tsx, passing the current trip ID and navigation object. This is the most direct path and bypasses the ShareTrip modal entirely.

**Entry Point 2: ProfileScreen Navigation (Modal)**
Users can also navigate to a dedicated ShareTrip screen via `navigation.navigate("Share", { tripId })`. This presents the ShareTripButton component (ShareTrip.tsx lines 82-121) as a full modal with proper UI, header, and description text. This modal then calls the same `onShare` function when the user taps the share button.

**Entry Point 3: ExpenseForm "+ Add Traveller" Dropdown**
A newer path allows users to select "+ add traveller" from traveller dropdowns in the ExpenseForm, which triggers navigation to the ShareTrip modal. This uses the enhanced `travellerToDropdown` function (split.ts lines 244-283) that conditionally includes an `__ADD_TRAVELLER__` option.

**The Core Sharing Process (onShare Function)**
Once any entry point calls `onShare(shareId, navigation)` (ShareTrip.tsx lines 21-80), the sharing flow follows these critical steps:

1. **API Key Loading**: Calls `loadKeys()` from PremiumConstants to retrieve the Branch.io API key ("BRAN"). This is a potential failure point because the function checks network speed first (`isConnectionFastEnough()`) and may return cached keys if the connection is slow. If the cached key is outdated or missing, sharing will fail silently.

2. **Branch.io Deep Link Generation**: Makes a POST request to `https://api2.branch.io/v1/url` with a structured payload containing the shareId, campaign tracking ("appinvite"), and deep link path (`join/{shareId}`). The API response provides a shortened URL for sharing. If this API call fails, the code falls back to a default invite link from localization (`i18n.t("inviteLink")`), but this fallback may not contain the actual trip ID needed for joining.

3. **Native Share Interface**: Uses React Native's built-in Share API to present the platform's native sharing interface with the generated URL and localized invite message. The share result is checked but not handled comprehensively - dismissed shares or failed shares may leave the user confused about the status.

4. **Navigation and Feedback**: Provides haptic feedback and navigates back to the previous screen regardless of share success or failure.

**Deep Link Handling and Join Flow**
The receiving end of shared links is handled through Branch.io integration (branch.ts). When someone clicks a shared link, the Branch subscriber (lines 12-51) processes the `$deeplink_path` parameter. If it starts with "join/", the app extracts the trip ID and navigates to the "Join" screen. However, this process has several fragility points:

- Deep links only work if Branch.io is properly initialized with a valid API key
- Non-branch links are detected but may not be handled gracefully
- The join navigation assumes the target trip still exists and is accessible

**Join Trip Process (Potential Failure Points)**
The JoinTrip screen (JoinTrip.tsx) handles both deep link arrivals and manual trip ID entry. The joining process involves several network-dependent operations that could fail:

1. **Network Validation**: Checks `isConnectionFastEnoughAsBool()` with a 3-second timeout and retry mechanism
2. **Trip Data Fetching**: Calls `fetchTrip(tripid)` to verify the trip exists and retrieve its data
3. **Traveller Registration**: Calls `putTravelerInTrip()` to add the user to the trip's traveller list
4. **Context Updates**: Updates TripContext, UserContext, and ExpensesContext with new data
5. **Storage Synchronization**: Updates local storage (MMKV) and secure storage

**Individual Share Button Issue (ExpenseForm)**
Based on the task description mentioning an individual share button next to the traveller dropdown that doesn't work, this refers to the IconButton with `people-circle-outline` icon (ExpenseForm.tsx lines 1585-1627). This button is supposed to automatically set up equal splitting among all travellers, but it's not actually sharing the trip - it's setting the split type to "EXACT" and calculating splits. The confusion likely stems from the button's icon and placement next to the traveller dropdown, making users think it's for inviting travellers when it's actually for split calculations.

### For Issue Investigation: Integration Points and Failure Scenarios

Since manual testing reveals intermittent sharing failures, the investigation needs to focus on these specific failure points:

**API Key Management Issues:**
The `loadKeys()` function in PremiumConstants (lines 69-96) has complex logic that fetches fresh keys from the server when network speed is sufficient, but falls back to cached keys when the connection is slow. If cached keys are corrupted, expired, or never properly set, the Branch.io API calls will fail with authentication errors. The function doesn't validate key format or test connectivity to Branch.io specifically.

**Network Connectivity Edge Cases:**
The sharing flow requires two different network checks: one for key loading (connection speed) and one for Branch.io API access (general connectivity). These checks happen at different times and may give inconsistent results. If network conditions change between the key loading and the API call, sharing could fail unexpectedly.

**Branch.io API Reliability:**
The code makes a direct HTTP POST to Branch.io without comprehensive error handling. Network timeouts, API rate limiting, service outages, or malformed responses could cause sharing to fail. The fallback to `i18n.t("inviteLink")` may not actually contain the trip ID needed for joining.

**Deep Link Processing Timing:**
The Branch.io subscriber in branch.ts processes incoming links, but there could be timing issues if the app isn't fully initialized when a deep link arrives. The subscriber assumes navigation is available and the app is in a state ready to handle navigation.

**Storage and State Synchronization:**
Sharing depends on accurate trip IDs from TripContext and proper authentication state from AuthContext. If these contexts are out of sync with stored data, sharing might fail or share the wrong trip ID.

### Technical Reference Details

#### Component Interfaces & Signatures

**ShareTrip Functions:**
```typescript
export async function onShare(shareId: string, navigation: any): Promise<void>
```

**API Integration:**
```typescript
export async function loadKeys(): Promise<Keys> // Keys.BRAN for Branch.io
```

**Branch Integration:**
```typescript
export async function initBranch(navigation: any): Promise<void>
// Subscriber handles: { error, params } with $deeplink_path processing
```

**Dropdown Enhancement:**
```typescript
export function travellerToDropdown(travellers: any[], includeAddTraveller: boolean = true): {label: string, value: string}[]
// Special value: "__ADD_TRAVELLER__" triggers navigation
```

#### Data Structures

**Branch.io Deep Link Payload:**
```javascript
{
  branch_key: string, // From BRAN key
  channel: "appinvite",
  campaign: "appinvite",
  tags: ["appinvite", shareId],
  $deeplink_path: `join/${shareId}`,
  data: { $deeplink_path: `join/${shareId}` }
}
```

**API Response Structure:**
```javascript
{
  url: string // Generated Branch.io short link
}
```

**Share API Payload:**
```javascript
{
  message: string, // i18n.t("inviteMessage")
  url: string      // Generated or fallback URL
}
```

#### Configuration Requirements

**Environment Variables/Keys:**
- `BRAN`: Branch.io API key (loaded via PremiumConstants)
- Stored in secure storage, refreshed based on network speed

**API Endpoints:**
- Branch.io: `https://api2.branch.io/v1/url` (POST)
- Firebase: `https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app`

**Network Dependencies:**
- Connection speed check for key loading
- Internet connectivity for Branch.io API
- Network stability for deep link processing

#### File Locations

**Core Implementation:**
- Share functionality: `/components/ProfileOutput/ShareTrip.tsx`
- Individual share button: `/components/ManageExpense/ExpenseForm.tsx` (lines 1585-1627)
- Join functionality: `/screens/JoinTrip.tsx`
- Trip management entry: `/components/ManageTrip/TripForm.tsx` (lines 720-727)

**Integration Points:**
- Branch deep linking: `/components/Referral/branch.ts`
- API key management: `/components/Premium/PremiumConstants.tsx`
- Dropdown enhancement: `/util/split.ts` (lines 244-283)
- Network monitoring: `/store/network-context.tsx`

**Context Management:**
- Trip context: `/store/trip-context.tsx`
- Auth context: `/store/auth-context.tsx`
- User context: `/store/user-context.tsx`

**Testing Focus Areas:**
- Branch.io API key validation and refresh
- Network connectivity edge cases during sharing
- Deep link processing timing and navigation
- ExpenseForm individual share button behavior clarification
- Share flow error handling and user feedback
- Cross-platform Share API behavior differences

## User Notes
Manual test and fix: sharing trip sometimes does not work.

## Work Log
- [2025-09-18] Created task