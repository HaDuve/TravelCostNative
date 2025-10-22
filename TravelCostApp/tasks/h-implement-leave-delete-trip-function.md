# FEAT: Leave/Delete Trip Function

## Task Overview

Implement a comprehensive leave/delete trip functionality that handles different scenarios based on whether other travellers are present in the trip.

## Requirements

### Core Functionality

1. **Leave Trip** - When other travellers are in the trip:
   - Remove current user from trip travellers list
   - Keep trip active for remaining travellers
   - Handle active trip reassignment if leaving user was on active trip

2. **Soft Delete Trip** - When no other travellers are in the trip:
   - Set `deleted` flag to `true`
   - Set `deletedTimestamp` flag to current timestamp
   - Remove trip from active trip lists

3. **Trip Filtering**:
   - Don't show deleted trips in any UI
   - Filter deleted trips from all trip-related queries

4. **Active Trip Management**:
   - If user has other trips AND deleted trip was ACTIVE:
     - Ask user which other trip to set as ACTIVE
   - If no other trips exist:
     - Create new trip as if user was freshly created

## Technical Implementation

### Files to Analyze and Update

- `store/trip-context.tsx` - Main trip management logic
- `store/user-context.tsx` - User state management
- `screens/` - UI screens that display trips
- `components/` - Trip-related components
- Database/API calls for trip operations

### Key Functions to Implement

1. `leaveTrip(tripId: string)` - Leave trip functionality
2. `deleteTrip(tripId: string)` - Soft delete trip functionality
3. `handleActiveTripChange()` - Manage active trip reassignment
4. `filterDeletedTrips()` - Filter out deleted trips
5. `createNewTripIfNeeded()` - Create new trip when user has none

### Success Criteria

- [ ] User can leave trips with other travellers
- [ ] User can delete trips when alone
- [ ] Deleted trips are hidden from all UI
- [ ] Active trip management works correctly
- [ ] New trip creation works when user has no trips
- [ ] All related functions are updated appropriately

## Context Analysis Needed

- Current trip data structure
- User-trip relationship management
- Active trip selection logic
- Trip filtering and display logic
- Database operations for trip management

## Priority: High

## Type: Feature Implementation

## Branch: feature/leave-delete-trip-function
