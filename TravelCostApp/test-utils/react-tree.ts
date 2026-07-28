import type { ReactTestInstance } from "react-test-renderer";

export function isDescendantOf(
  node: ReactTestInstance,
  ancestor: ReactTestInstance
): boolean {
  let parent = node.parent;
  while (parent) {
    if (parent === ancestor) return true;
    parent = parent.parent;
  }
  return false;
}
