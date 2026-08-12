import * as React from "react";
import { StyleSheet, Text } from "react-native";
import { renderWithAppProviders } from "../fixtures/app-providers";
import ResponsiveGrid from "../../components/layout/ResponsiveGrid";
import { layoutFor } from "../../util/layout";

describe("ResponsiveGrid", () => {
  it("lays out children in two columns with column-first flow on wide breakpoints", () => {
    const layout = layoutFor({ width: 1024, height: 768 });
    const screen = renderWithAppProviders(
      <ResponsiveGrid
        testID="responsive-grid"
        layout={layout}
        items={[
          { key: "one", render: () => <Text>One</Text> },
          { key: "two", render: () => <Text>Two</Text> },
          { key: "three", render: () => <Text>Three</Text> },
          { key: "four", render: () => <Text>Four</Text> },
        ]}
      />,
      { wrapNavigation: false }
    );

    const gridStyle = StyleSheet.flatten(
      screen.getByTestId("responsive-grid").props.style
    ) as Record<string, unknown>;

    expect(gridStyle.flexDirection).toBe("row");
    expect(gridStyle.flexWrap).toBe("wrap");
    expect(screen.getAllByTestId("responsive-grid-column")).toHaveLength(2);
    expect(screen.getByText("One")).toBeTruthy();
    expect(screen.getByText("Three")).toBeTruthy();
  });
});
