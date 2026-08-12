import type { LayoutProfile } from "../util/layout";

export const OVERVIEW_BODY_COLUMN_WIDTHS: [number, number] = [3, 7];

export function isOverviewWideLayout(layout: LayoutProfile) {
  return layout.breakpoint === "wide";
}
