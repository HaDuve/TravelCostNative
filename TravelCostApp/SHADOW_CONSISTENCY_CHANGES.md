# Shadow Consistency Changes

## Summary
Made all three screen areas use consistent shadow separation matching the ProfileScreen (the cleanest implementation).

## Changes Made

### 1. OverviewScreen - TripPeriodChrome (First Tab)
**File**: `styles/shadow-regression-styles.ts`

**Changed**: `overviewDividerBar` style
- **Before**: Used heavy border + strong shadow (opacity 0.9, multiple elevation settings)
- **After**: Clean shadow matching ProfileToolbar
  - iOS: `shadowColor: textColor`, `shadowOffset: {width: 0, height: 2}`, `shadowOpacity: 0.12`, `shadowRadius: 4`
  - Android: `elevation: 4`

### 2. TripSummaryScreen (Second Tab)
**File**: `screens/TripSummaryScreen.tsx`

**Changes**:
- Added fixed header bar with shadow (matching ProfileToolbar style)
- Removed `marginTop` from ScrollView
- Title now in header bar (clean, consistent with other screens)
- Content scrolls underneath the header

**New Structure**:
```tsx
<View style={styles.container}>
  <View style={styles.headerBar}>  {/* Fixed header with shadow */}
    <Text style={styles.screenTitle}>{i18n.t("summary")}</Text>
  </View>
  <View style={styles.shadowSeparator} />
  <ScrollView>
    {/* Scrollable content */}
  </ScrollView>
</View>
```

### 3. ProfileScreen (Profile Tab) - Reference Implementation
**File**: `components/ManageProfile/ProfileToolbar.tsx`

**No changes** - This was the goal state with the cleanest shadow:
- iOS: `shadowColor: textColor`, `shadowOffset: {width: 0, height: 2}`, `shadowOpacity: 0.12`, `shadowRadius: 4`
- Android: `elevation: 4`

## Testing Instructions

### Quick Visual Test
1. Reload the app (shake device → Reload or press 'r' in Metro terminal)
2. Navigate to each tab and observe the shadow separation below the header:
   - **First tab (Overview)**: Check the shadow below "Heute" dropdown area
   - **Second tab (Trip Summary)**: Check the shadow below "Summary" title
   - **Profile tab**: Reference - should match the other two

### What to Look For
✓ All three tabs should have the same subtle shadow separation
✓ Shadow should be consistent: soft, subtle, professional
✓ No heavy borders or over-emphasized shadows
✓ Trip Summary title should scroll with content (not sticky)

## Rollback (if needed)
If changes cause issues, revert these files:
```bash
git checkout screens/TripSummaryScreen.tsx
git checkout styles/shadow-regression-styles.ts
```

## Next Steps
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/simulator
- [ ] Verify shadow appears consistent across different screen sizes
- [ ] Check that scroll behavior feels natural on all tabs
