import type { LayoutProfile } from "../util/layout";
import { dynamicScale } from "../util/scalingUtil";

function sharedPeriodChrome(layout: LayoutProfile) {
  return {
    periodHeaderRow: {
      flexDirection: "row" as const,
      justifyContent: "space-evenly" as const,
      alignItems: "stretch" as const,
      zIndex: 10,
    },
    headerCard: {
      flex: 1,
      maxWidth: "50%" as const,
      borderRadius: 10,
      borderWidth: 1,
    },
  };
}

/** Preserves pre-#387 phone/tablet-medium chrome until screens consume a live layout profile (#388). */
function narrowAndMediumPeriodChrome(layout: LayoutProfile) {
  const shared = sharedPeriodChrome(layout);

  return {
    periodHeaderLabelFontSize: dynamicScale(28, false, 0.5),
    periodHeaderRow: {
      ...shared.periodHeaderRow,
      gap: dynamicScale(12, true),
      marginTop: dynamicScale(18, true),
      paddingHorizontal: dynamicScale(12),
      marginBottom: dynamicScale(12, true),
    },
    periodDateHeader: {
      marginTop: dynamicScale(12, true),
      marginLeft: dynamicScale(18),
      marginBottom: dynamicScale(-4, true),
    },
    headerCard: {
      ...shared.headerCard,
      minHeight: dynamicScale(52, true),
      paddingVertical: dynamicScale(4, true),
    },
    dropdownContainer: {
      marginTop: dynamicScale(2, true),
    },
  };
}

function widePeriodChrome(layout: LayoutProfile) {
  const shared = sharedPeriodChrome(layout);

  return {
    periodHeaderLabelFontSize: layout.type(28),
    periodHeaderRow: {
      ...shared.periodHeaderRow,
      gap: layout.space(3),
      marginTop: layout.space(4),
      paddingHorizontal: layout.space(3),
      marginBottom: layout.space(3),
    },
    periodDateHeader: {
      marginTop: layout.space(3),
      marginLeft: layout.space(4),
      marginBottom: -layout.space(1),
    },
    headerCard: {
      ...shared.headerCard,
      minHeight: layout.space(6),
      paddingVertical: layout.space(1),
    },
    dropdownContainer: {
      marginTop: layout.space(1),
    },
  };
}

export function tripPeriodLayoutTokens(layout: LayoutProfile) {
  if (layout.breakpoint === "wide") {
    return widePeriodChrome(layout);
  }

  return narrowAndMediumPeriodChrome(layout);
}

export type TripPeriodLayoutTokens = ReturnType<typeof tripPeriodLayoutTokens>;
