---
task: m-fix-small-phone-layout
branch: fix/small-phone-layout
status: pending
created: 2025-09-18
modules: [components/ExpenseItem, components/layouts]
---

# Fix Small Phone Layout Issue with Expense Item List

## Problem/Goal

Small phones (eg: iPhone SE) have layout issues with 2 lines of text in expense item list. Text should not wrap into multiple lines, causing poor UX on small screens.

## Success Criteria

- [ ] Text in expense item list displays on single line on iPhone SE
- [ ] Implement responsive text sizing or truncation
- [ ] Test on various small screen sizes
- [ ] Ensure readability is maintained

## Context Manifest

### How This Currently Works: Expense Item List Layout System

When the app displays expenses in the main list view, the architecture follows a multi-layered rendering approach that handles responsive sizing for different device types. The flow begins when ExpensesList.tsx renders a FlatList of expense items, where each individual expense is rendered through ExpenseItem.tsx.

The ExpenseItem component (ExpenseItem.tsx:265-362) uses a complex flexbox layout with several key sections arranged horizontally: an icon container, a left text section with description and date, optional country flags and traveller avatars, and a right-aligned amount container. The critical layout issue occurs in the leftItem section (styles.leftItem:423-429) which contains two Text components - the description and the date string.

Currently, the description text uses these layout properties: fontSize: dynamicScale(15, false, 0.5), numberOfLines: 1, ellipsizeMode: "tail", and maxFontSizeMultiplier: 1.2. The date text uses fontSize: dynamicScale(13, false, 0.5) and maxFontSizeMultiplier: 1. However, on small phones like iPhone SE (375px base width), the dynamicScale function in scalingUtil.ts calculates font sizes that can cause layout issues when combined with the horizontal flex layout constraints.

The scaling system (scalingUtil.ts:28-61) uses a guideline base width of 375px and applies moderation factors to scale text appropriately. The dynamicScale function considers device orientation, tablet vs phone multipliers (tabletScaleMult = 1.2, phoneScaleMult = 0.9), and whether scaling should be vertical or horizontal. For text, it uses a moderation factor of 0.5 which moderates the scaling between the base size and the fully scaled size.

The layout problem manifests when the leftItem container (flex: 1, height: constantScale(40, 0.5)) doesn't provide sufficient width for the text content at the calculated font sizes. Even with numberOfLines: 1 and ellipsizeMode: "tail", the text can wrap inappropriately or overflow the container, particularly when additional elements like country flags (settingShowFlags) or traveller avatars (settingShowWhoPaid) are enabled, which further constrain the available horizontal space.

The ExpenseItem height is fixed at constantScale(55) in portrait and dynamicScale(100, true) in landscape orientation. The orientation context (OrientationContext) provides device dimensions and orientation state, but the current implementation doesn't adjust text sizing based on available width constraints - it only considers the overall device scaling factors.

### For New Feature Implementation: Small Phone Layout Optimization

Since we're implementing small phone layout improvements, we need to create a responsive text sizing system that detects constrained horizontal space and adjusts accordingly. The solution will integrate with the existing scaling system while adding width-aware font size adjustments.

The current architecture provides several integration points. The OrientationContext already exposes device width and height, so we can use these values to detect small phones (width <= 375px could be our threshold for iPhone SE and similar devices). The existing dynamicScale function with its moderation factor system provides a foundation for calculating adjusted font sizes.

For the implementation, we'll need to enhance the text rendering in ExpenseItem.tsx lines 309-331 (description text) and 322-331 (date text). The key is to detect when horizontal space is constrained and apply additional font size reduction beyond the standard scaling. We could add a utility function that calculates available text width by considering the icon container width, amount container width (constantScale(150, 0.5)), and any enabled optional elements like country flags or avatars.

The styles.leftItem container currently uses flex: 1 which allows it to expand to fill available space, but we need to ensure the text within respects the calculated constraints. We could implement a cascading font size reduction: start with the standard dynamicScale size, then apply additional reduction if the device width is small, and potentially add a third level of reduction if multiple optional elements are enabled.

The existing maxFontSizeMultiplier properties (1.2 for description, 1 for date) limit text growth for accessibility, but we'll need to add corresponding logic for font size reduction to maintain readability while preventing overflow. The solution should maintain the existing ellipsizeMode: "tail" behavior as a fallback for extremely long text.

### Technical Reference Details

#### Component Interfaces & Signatures

**ExpenseItem Component (ExpenseItem.tsx:41-56)**

```typescript
function ExpenseItem(props): JSX.Element {
  const { showSumForTravellerName, filtered, setSelectable } = props;
  const {
    id,
    description,
    amount,
    category,
    country,
    whoPaid,
    currency,
    calcAmount,
    splitList,
    iconName,
    isSpecialExpense,
  }: ExpenseData = props;
  let { date } = props;
}
```

**OrientationContext Interface (orientation-context.tsx:8-15)**

```typescript
{
  orientation: "PORTRAIT" | "LANDSCAPE",
  isPortrait: boolean,
  isLandscape: boolean,
  isTablet: boolean,
  width: number,
  height: number
}
```

**Scaling Functions (scalingUtil.ts:28-76)**

```typescript
const dynamicScale = (
  size: number,
  vertical = false,
  moderateFactor: number = null
) => number;
const constantScale = (size: number, moderateFactor: number = null) => number;
const isTablet = () => boolean;
```

#### Data Structures

**Current Layout Measurements**

- Base guideline width: 375px (iPhone SE reference)
- ExpenseItem height: constantScale(55) portrait / dynamicScale(100, true) landscape
- Icon container: height constantScale(44, 0.5), margin/padding dynamicScale values
- Amount container: width constantScale(150, 0.5), height constantScale(40, 0.5)
- LeftItem container: flex: 1, height constantScale(40, 0.5)
- Country flag: width constantScale(50), height constantScale(40)
- Avatar container: width constantScale(55), height constantScale(30, 1)

**Current Font Sizing**

- Description: fontSize dynamicScale(15, false, 0.5), maxFontSizeMultiplier 1.2
- Date: fontSize dynamicScale(13, false, 0.5), maxFontSizeMultiplier 1
- Amount: fontSize dynamicScale(20, false, 0.5)

#### Configuration Requirements

**Small Phone Detection Logic**

```typescript
// Potential threshold for small phone detection
const isSmallPhone = width <= 375; // iPhone SE baseline
const isVerySmallPhone = width <= 320; // Older devices
```

**Scaling Configuration (scalingUtil.ts:10-11)**

```typescript
const tabletScaleMult = 1.2;
const phoneScaleMult = 0.9;
```

#### File Locations

- **Implementation goes here**: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/ExpensesOutput/ExpenseItem.tsx` (lines 309-331 for text, 386-495 for styles)
- **Scaling utilities**: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/util/scalingUtil.ts` (add helper functions)
- **Related context**: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/store/orientation-context.tsx`
- **Global styles**: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/constants/styles.ts`
- **Tests should go**: Consider adding responsive layout tests to verify text doesn't overflow on various screen sizes

## Context Files

## User Notes

<!-- Any specific notes or requirements from the developer -->

## Work Log

<!-- Updated as work progresses -->

- [YYYY-MM-DD] Started task, initial research
