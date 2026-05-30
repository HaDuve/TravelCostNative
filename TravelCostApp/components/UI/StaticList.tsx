import * as React from "react";
import { View } from "react-native";

export type StaticListProps<T> = {
  data: readonly T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: React.ReactElement | (() => React.ReactElement | null);
  ListFooterComponent?: React.ReactElement | (() => React.ReactElement | null);
  ListEmptyComponent?: React.ReactElement | (() => React.ReactElement | null);
  style?: React.ComponentProps<typeof View>["style"];
  contentContainerStyle?: React.ComponentProps<typeof View>["style"];
};

function renderSlot(
  slot: React.ReactElement | (() => React.ReactElement | null) | undefined
): React.ReactElement | null {
  if (!slot) return null;
  return typeof slot === "function" ? slot() : slot;
}

function StaticList<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  style,
  contentContainerStyle,
}: StaticListProps<T>) {
  const header = renderSlot(ListHeaderComponent);
  const footer = renderSlot(ListFooterComponent);
  const empty = renderSlot(ListEmptyComponent);

  return (
    <View style={style}>
      <View style={contentContainerStyle} testID="static-list-content">
        {header}
        {data.length === 0
          ? empty
          : data.map((item, index) => (
              <React.Fragment
                key={keyExtractor ? keyExtractor(item, index) : String(index)}
              >
                {renderItem({ item, index })}
              </React.Fragment>
            ))}
        {footer}
      </View>
    </View>
  );
}

export default StaticList;
