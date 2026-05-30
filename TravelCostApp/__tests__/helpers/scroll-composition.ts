import { FlatList, ScrollView } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";

function getComponentName(type: unknown): string {
  const typeName = type as { displayName?: string; name?: string };
  return typeName?.displayName ?? typeName?.name ?? "";
}

const VIRTUALIZED_LIST_COMPONENT_NAMES = new Set([
  "FlatList",
  "VirtualizedList",
  "AnimatedFlatList",
  "ReanimatedFlatList",
]);

export function isVirtualizedListComponent(node: ReactTestInstance): boolean {
  if (node.type === FlatList) return true;
  const name = getComponentName(node.type);
  return VIRTUALIZED_LIST_COMPONENT_NAMES.has(name);
}

function isVerticalFlatList(node: ReactTestInstance): boolean {
  const horizontal = node.props?.horizontal;
  return horizontal !== true;
}

function isVerticalScrollView(node: ReactTestInstance): boolean {
  const horizontal = node.props?.horizontal;
  return horizontal !== true;
}

function isScrollViewComponent(node: ReactTestInstance): boolean {
  if (node.type === ScrollView) return true;
  const name = getComponentName(node.type);
  return name === "ScrollView" || name === "RCTScrollView";
}

function collectNestedVerticalFlatLists(
  node: ReactTestInstance,
  insideVerticalScrollView: boolean
): ReactTestInstance[] {
  const violations: ReactTestInstance[] = [];

  const isScrollView = isScrollViewComponent(node);
  const isFlatList = isVirtualizedListComponent(node);

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
