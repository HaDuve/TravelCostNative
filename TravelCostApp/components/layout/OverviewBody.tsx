import * as React from "react";
import type { LayoutProfile } from "../../util/layout";
import ResponsiveGrid from "./ResponsiveGrid";

type OverviewBodyProps = {
  layout: LayoutProfile;
  summary: React.ReactNode;
  chart: React.ReactNode;
};

export default function OverviewBody({
  layout,
  summary,
  chart,
}: OverviewBodyProps) {
  if (layout.breakpoint === "narrow") {
    return <>{chart}</>;
  }

  return (
    <ResponsiveGrid
      testID="overview-body-grid"
      layout={layout}
      columnWidths={[3, 7]}
      items={[
        {
          key: "summary",
          column: "left",
          render: () => summary,
        },
        {
          key: "chart",
          column: "right",
          render: () => chart,
        },
      ]}
    />
  );
}
