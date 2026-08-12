import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import type { LayoutProfile } from "../../util/layout";

type ResponsiveGridItem = {
  key: string;
  render: () => React.ReactNode;
};

type ResponsiveGridProps = {
  layout: LayoutProfile;
  items: ResponsiveGridItem[];
  columnWidths?: [number, number];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function splitColumnFirst(items: ResponsiveGridItem[]) {
  const left: ResponsiveGridItem[] = [];
  const right: ResponsiveGridItem[] = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
      return;
    }
    right.push(item);
  });

  return [left, right] as const;
}

export default function ResponsiveGrid({
  layout,
  items,
  columnWidths = [1, 1],
  style,
  testID,
}: ResponsiveGridProps) {
  const isMultiColumn = layout.breakpoint !== "narrow";
  const [leftColumn, rightColumn] = splitColumnFirst(items);
  const totalWidth = columnWidths[0] + columnWidths[1];

  if (!isMultiColumn) {
    return (
      <View testID={testID} style={style}>
        {items.map((item) => (
          <React.Fragment key={item.key}>{item.render()}</React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[{ flexDirection: "row", flexWrap: "wrap", gap: layout.space(3) }, style]}
    >
      <View
        testID="responsive-grid-column"
        style={{ flexGrow: columnWidths[0], flexBasis: `${(columnWidths[0] / totalWidth) * 100}%` }}
      >
        {leftColumn.map((item) => (
          <React.Fragment key={item.key}>{item.render()}</React.Fragment>
        ))}
      </View>
      <View
        testID="responsive-grid-column"
        style={{ flexGrow: columnWidths[1], flexBasis: `${(columnWidths[1] / totalWidth) * 100}%` }}
      >
        {rightColumn.map((item) => (
          <React.Fragment key={item.key}>{item.render()}</React.Fragment>
        ))}
      </View>
    </View>
  );
}
