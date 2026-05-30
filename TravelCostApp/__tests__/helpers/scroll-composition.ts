import { FlatList, ScrollView } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

function isVerticalFlatList(node: ReactTestInstance): boolean {
  const horizontal = node.props?.horizontal;
  return horizontal !== true;
}

function isVerticalScrollView(node: ReactTestInstance): boolean {
  const horizontal = node.props?.horizontal;
  return horizontal !== true;
}

function collectNestedVerticalFlatLists(
  node: ReactTestInstance,
  insideVerticalScrollView: boolean
): ReactTestInstance[] {
  const violations: ReactTestInstance[] = [];
  const typeName = node.type as { displayName?: string; name?: string };
  const name = typeName?.displayName ?? typeName?.name ?? "";

  const isScrollView =
    node.type === ScrollView || name === "ScrollView" || name === "RCTScrollView";
  const isFlatList =
    node.type === FlatList ||
    name === "FlatList" ||
    name === "VirtualizedList" ||
    name === "AnimatedFlatList";

  const nowInsideScrollView =
    insideVerticalScrollView ||
    (isScrollView && isVerticalScrollView(node));

  if (nowInsideScrollView && isFlatList && isVerticalFlatList(node)) {
    violations.push(node);
  }

  node.children.forEach((child) => {
    if (typeof child === "object" && child !== null && "type" in child) {
      violations.push(
        ...collectNestedVerticalFlatLists(
          child as ReactTestInstance,
          nowInsideScrollView
        )
      );
    }
  });

  return violations;
}

export function findNestedVerticalFlatLists(
  root: ReactTestInstance
): ReactTestInstance[] {
  return collectNestedVerticalFlatLists(root, false);
}

export function assertNoNestedVerticalFlatLists(root: ReactTestInstance): void {
  const violations = findNestedVerticalFlatLists(root);
  if (violations.length > 0) {
    throw new Error(
      `Found ${violations.length} vertical FlatList(s) nested inside a vertical ScrollView`
    );
  }
}
