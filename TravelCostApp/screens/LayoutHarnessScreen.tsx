import * as React from "react";
import { ScrollView, Text, View } from "react-native";

import { useWindowSize } from "../components/Hooks/useWindowSize";
import { useLayoutProfile } from "../store/layout-context";
import { compareLayoutToLegacyScaling } from "../util/layout-harness";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 700, height: 900 },
  { width: 1024, height: 768 },
];

export default function LayoutHarnessScreen() {
  const liveLayout = useLayoutProfile();
  const { width, height } = useWindowSize();
  const liveComparison = compareLayoutToLegacyScaling({ width, height });

  return (
    <ScrollView
      contentContainerStyle={{
        padding: liveLayout.space(3),
        gap: liveLayout.space(3),
      }}
    >
      <Text testID="layout-harness-live-breakpoint">
        Live breakpoint: {liveLayout.breakpoint}
      </Text>
      <Text testID="layout-harness-live-spacing">
        Live space(4): {liveLayout.space(4)}
      </Text>
      <Text testID="layout-harness-live-legacy-spacing">
        Legacy dynamicScale(20): {liveComparison.legacySpacing}
      </Text>

      {VIEWPORTS.map((viewport) => {
        const comparison = compareLayoutToLegacyScaling(viewport);

        return (
          <View key={`${viewport.width}x${viewport.height}`} testID="layout-harness-row">
            <Text>
              {viewport.width}x{viewport.height} · {comparison.breakpoint} ·{" "}
              {comparison.orientation}
            </Text>
            <Text>
              space(4) {comparison.layoutSpacing} vs legacy {comparison.legacySpacing}
            </Text>
            <Text>
              type(20) {comparison.layoutTypography} vs legacy{" "}
              {comparison.legacyTypography}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
