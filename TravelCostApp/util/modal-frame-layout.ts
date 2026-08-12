import type { LayoutProfile } from "../util/layout";

export const MODAL_WIDE_BREAKPOINT = 600;
export const MODAL_MAX_WIDTH = 600;

export function isModalWide(layout: LayoutProfile) {
  // Layout narrow breakpoint is < MODAL_WIDE_BREAKPOINT (600).
  return layout.breakpoint !== "narrow";
}
