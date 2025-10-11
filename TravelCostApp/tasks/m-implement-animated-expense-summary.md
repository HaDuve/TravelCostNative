# Task: Implement Animated Number Ticker for ExpensesSummary

## Priority: Medium

- Type: Implementation
- Component: ExpensesSummary.tsx
- Estimated Time: 4-6 hours

## Description

Create a smooth animated number ticker component for the ExpensesSummary that animates individual digits vertically when values change. This implementation will use react-native-reanimated for performant animations with staggered transitions.

## Technical Requirements

### Core Components

1. Ticker Component (Main Container):
   - Receives value and font size props
   - Handles number formatting and splitting
   - Manages dynamic font size calculations
   - Supports currency formatting

2. TickerList Component (Digit Container):
   - Renders vertical list of numbers (0-9)
   - Handles individual digit animations using Reanimated
   - Uses shared values for smooth transitions
   - Implements staggered animations

3. Tick Component (Individual Number):
   - Reusable text component
   - Handles monospace formatting
   - Supports font weight and styling
   - Uses tabular-nums variant

### Animation Specifications

- Use Reanimated.View and shared values
- Stagger delay: 50ms between digits
- Spring configuration:
  - damping: 20
  - stiffness: 200
- Vertical translation based on font size
- Support for currency symbols and decimals

### Font Size Management

- Dynamic font size calculation
- Single line constraint
- Auto-adjustment for large numbers
- Uses onTextLayout for size calculations
- Maintains consistent spacing with tabular-nums

## Implementation Steps

1. Setup Phase
   - [ ] Verify react-native-reanimated installation
   - [ ] Create base component structure
   - [ ] Set up TypeScript types

2. Core Components Implementation
   - [ ] Create Tick component (base number display)
   - [ ] Implement TickerList with Reanimated.View
   - [ ] Build main Ticker component
   - [ ] Add font size calculation logic

3. Animation Implementation
   - [ ] Set up shared values for transitions
   - [ ] Implement vertical translation with withSpring
   - [ ] Add staggered animations using withDelay
   - [ ] Configure spring animations

4. Integration with ExpensesSummary
   - [ ] Replace current number display
   - [ ] Handle currency formatting
   - [ ] Implement dynamic font sizing
   - [ ] Add internationalization support

## Technical Details

### Animation Logic

```typescript
// Example animation configuration using Reanimated
import Animated, {
  withSpring,
  withDelay,
  useSharedValue,
  useAnimatedStyle
} from 'react-native-reanimated';

const TickerDigit = ({ digit, index }) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * 50,
      withSpring(digit * -fontSize * 1.1, {
        damping: 20,
        stiffness: 200
      })
    );
  }, [digit]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      {/* Vertical number list */}
    </Animated.View>
  );
};
```

### Font Size Calculation

```typescript
// Dynamic font size adjustment
<Text
  numberOfLines={1}
  adjustsFontSizeToFit
  onTextLayout={(e) => {
    const ascender = e.nativeEvent.lines[0]?.ascender;
    setNewFontSize(ascender);
  }}
  style={{ fontVariant: ['tabular-nums'] }}
>
```

### Component Structure

```typescript
interface TickerProps {
  value: number;
  fontSize?: number;
  currency?: string;
}

interface TickerDigitProps {
  digit: number;
  index: number;
  fontSize: number;
}

interface TickProps extends TextProps {
  fontSize: number;
}
```

## Success Criteria

1. Smooth digit animations with staggered effect
2. Proper handling of currency symbols and formatting
3. Automatic font size adjustment for large numbers
4. Consistent spacing and alignment
5. No performance issues
6. Maintains accessibility

## Technical Constraints

- Must use react-native-reanimated for animations
- Support both iOS and Android
- Support existing currency formatting
- Maintain performance with frequent updates

## Dependencies

- react-native-reanimated
- Existing currency formatting utilities

## Testing Requirements

1. Unit tests for digit splitting logic
2. Animation timing tests
3. Font size calculation tests
4. Performance benchmarks
5. Currency format testing
6. RTL support testing

## Resources

- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Text Component](https://reactnative.dev/docs/text)
- [Reanimated Shared Values Guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/shared-values)
