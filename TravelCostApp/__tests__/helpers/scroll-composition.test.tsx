import { FlatList } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

import { isVirtualizedListComponent } from "./scroll-composition";

function mockNode(type: unknown, props: Record<string, unknown> = {}): ReactTestInstance {
  return { type, props, children: [] } as ReactTestInstance;
}

describe("scroll composition", () => {
  it("treats Reanimated and Animated FlatList display names as virtualized lists", () => {
    expect(
      isVirtualizedListComponent(
        mockNode({ displayName: "ReanimatedFlatList" })
      )
    ).toBe(true);
    expect(
      isVirtualizedListComponent(mockNode({ displayName: "AnimatedFlatList" }))
    ).toBe(true);
    expect(
      isVirtualizedListComponent(mockNode({ displayName: "VirtualizedList" }))
    ).toBe(true);
  });

  it("treats react-native FlatList type as a virtualized list", () => {
    expect(isVirtualizedListComponent(mockNode(FlatList))).toBe(true);
  });

  it("does not treat unrelated components as virtualized lists", () => {
    expect(
      isVirtualizedListComponent(mockNode({ displayName: "ScrollView" }))
    ).toBe(false);
    expect(
      isVirtualizedListComponent(mockNode({ displayName: "StaticList" }))
    ).toBe(false);
  });
});
