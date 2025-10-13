# Context Manifest: SafeAreaView Wrapper Implementation

## Current App Structure Analysis

### SafeAreaView Usage

The app currently uses **two separate SafeAreaView components** in `App.tsx`:

1. **Status Bar SafeAreaView** (lines 934-941):

   ```tsx
   <SafeAreaView
     style={{
       flex: 0,
       backgroundColor: GlobalStyles.colors.backgroundColor,
       paddingTop: Platform.OS === "android" ? StatusBarRN.currentHeight : 0,
     }}
   />
   ```

2. **Main Content SafeAreaView** (lines 942-947):
   ```tsx
   <SafeAreaView
     style={{
       flex: 1,
       backgroundColor: GlobalStyles.colors.gray500,
     }}
   >
   ```

### Component Hierarchy

```
App
├── View (flex: 1, onStartShouldSetResponder)
    └── View (flex: 1)
        ├── SafeAreaView (flex: 0, status bar handling)
        └── SafeAreaView (flex: 1, main content)
            ├── StatusBar (expo-status-bar)
            └── Context Providers
                └── Navigation
```

### Platform-Specific Handling

- **Android**: Uses `StatusBarRN.currentHeight` for status bar padding
- **iOS**: No additional padding needed (SafeAreaView handles this automatically)
- **Status Bar**: Uses `expo-status-bar` with `style="auto"`

### Screen-Level Safe Area Handling

From the codebase search, individual screens handle safe areas differently:

1. **SettingsScreen**: Uses platform-specific padding in ScrollView

   ```tsx
   ...Platform.select({
     ios: { padding: 0 },
     android: { paddingTop: dynamicScale(18, true) },
   })
   ```

2. **Other Screens**: Rely on the global SafeAreaView wrapper

### Context Providers Structure

The app has a complex context provider hierarchy that must be preserved:

- AuthContextProvider
- NetworkContextProvider
- TripContextProvider
- UserContextProvider
- SettingsProvider
- NetworkProvider
- ExpensesContextProvider
- OrientationContextProvider
- GestureHandlerRootView
- TourGuideProvider

### Styling Dependencies

- `GlobalStyles.colors.backgroundColor` - Used for status bar area
- `GlobalStyles.colors.gray500` - Used for main content area
- `dynamicScale()` - Used for responsive scaling
- Platform-specific styling patterns

## Implementation Requirements

### Technical Constraints

1. **Preserve Context Hierarchy**: All context providers must remain in the same order
2. **Maintain Platform Handling**: Android status bar height must still be handled
3. **Keep Status Bar**: expo-status-bar must remain functional
4. **Preserve Styling**: Background colors and layout must remain consistent
5. **Maintain Touch Handling**: `onStartShouldSetResponder` must be preserved

### Expected Benefits

1. **Simplified Structure**: Single SafeAreaView wrapper
2. **Consistent Behavior**: Uniform safe area handling across all screens
3. **Easier Maintenance**: Centralized safe area logic
4. **Better Performance**: Reduced component nesting

### Risk Mitigation

1. **Layout Testing**: Test on both iOS and Android
2. **Screen Validation**: Verify all screens render correctly
3. **Context Preservation**: Ensure no context providers are affected
4. **Status Bar**: Verify status bar behavior remains correct

## Implementation Strategy

### Phase 1: Analysis

- [x] Document current SafeAreaView usage
- [x] Identify all context providers
- [x] Map platform-specific requirements

### Phase 2: Design

- [ ] Design single SafeAreaView wrapper structure
- [ ] Plan context provider preservation
- [ ] Design platform-specific handling

### Phase 3: Implementation

- [ ] Refactor App.tsx with single SafeAreaView
- [ ] Test on both platforms
- [ ] Validate all screens

### Phase 4: Validation

- [ ] Cross-platform testing
- [ ] Screen-by-screen validation
- [ ] Performance verification

## Files to Modify

- `App.tsx` - Main implementation
- Potentially remove platform-specific padding from individual screens

## Dependencies

- React Native SafeAreaView
- expo-status-bar
- Platform-specific status bar handling
- All existing context providers
