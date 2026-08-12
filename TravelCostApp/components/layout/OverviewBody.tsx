import * as React from "react";
import { View } from "react-native";
import type { LayoutProfile } from "../../util/layout";
import {
  isOverviewWideLayout,
  OVERVIEW_BODY_COLUMN_WIDTHS,
} from "../../styles/overview-layout-tokens";
import { ChartContainerWidthProvider } from "../../store/chart-container-width-context";
import ResponsiveGrid from "./ResponsiveGrid";

type OverviewBodyProps = {
  layout: LayoutProfile;
  summary: React.ReactNode;
  chart: React.ReactNode;
};

function OverviewChartColumn({ children }: { children: React.ReactNode }) {
  const [chartColumnWidth, setChartColumnWidth] = React.useState<number>();

  return (
    <View
      testID="overview-chart-column"
      onLayout={(event) => {
        setChartColumnWidth(event.nativeEvent.layout.width);
      }}
    >
      <ChartContainerWidthProvider width={chartColumnWidth}>
        {children}
      </ChartContainerWidthProvider>
    </View>
  );
}

export default function OverviewBody({
  layout,
  summary,
  chart,
}: OverviewBodyProps) {
  if (!isOverviewWideLayout(layout)) {
    return <>{chart}</>;
  }

  return (
    <ResponsiveGrid
      testID="overview-body-grid"
      layout={layout}
      columnWidths={OVERVIEW_BODY_COLUMN_WIDTHS}
      items={[
        {
          key: "summary",
          column: "left",
          render: () => summary,
        },
        {
          key: "chart",
          column: "right",
          render: () => (
            <OverviewChartColumn>{chart}</OverviewChartColumn>
          ),
        },
      ]}
    />
  );
}
