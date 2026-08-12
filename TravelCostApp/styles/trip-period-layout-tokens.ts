import type { LayoutProfile } from "../util/layout";

export function tripPeriodLayoutTokens(layout: LayoutProfile) {
  return {
    periodHeaderLabelFontSize: layout.type(28),
    periodHeaderRow: {
      flexDirection: "row" as const,
      justifyContent: "space-evenly" as const,
      alignItems: "stretch" as const,
      gap: layout.space(3),
      zIndex: 10,
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
      flex: 1,
      maxWidth: "50%" as const,
      minHeight: layout.space(6),
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: layout.space(1),
    },
  };
}

export type TripPeriodLayoutTokens = ReturnType<typeof tripPeriodLayoutTokens>;
