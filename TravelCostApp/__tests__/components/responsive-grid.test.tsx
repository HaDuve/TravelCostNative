import * as React from "react";
import { StyleSheet, Text } from "react-native";
import { within } from "@testing-library/react-native";
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
          { key: "one", render: () => <Text testID="grid-item-one">One</Text> },
          { key: "two", render: () => <Text testID="grid-item-two">Two</Text> },
          {
            key: "three",
            render: () => <Text testID="grid-item-three">Three</Text>,
          },
          { key: "four", render: () => <Text testID="grid-item-four">Four</Text> },
        ]}
      />,
      { wrapNavigation: false }
    );

    const gridStyle = StyleSheet.flatten(
      screen.getByTestId("responsive-grid").props.style
    ) as Record<string, unknown>;

    expect(gridStyle.flexDirection).toBe("row");
    expect(gridStyle.flexWrap).toBe("wrap");

    const [leftColumn, rightColumn] = screen.getAllByTestId("responsive-grid-column");
    expect(within(leftColumn).getByTestId("grid-item-one")).toBeTruthy();
    expect(within(leftColumn).getByTestId("grid-item-three")).toBeTruthy();
    expect(within(rightColumn).getByTestId("grid-item-two")).toBeTruthy();
    expect(within(rightColumn).getByTestId("grid-item-four")).toBeTruthy();
  });

  it("uses two columns from the modal breakpoint upward", () => {
    const layout = layoutFor({ width: 700, height: 900 });
    const screen = renderWithAppProviders(
      <ResponsiveGrid
        testID="responsive-grid"
        layout={layout}
        items={[
          { key: "one", render: () => <Text testID="grid-item-one">One</Text> },
          { key: "two", render: () => <Text testID="grid-item-two">Two</Text> },
        ]}
      />,
      { wrapNavigation: false }
    );

    expect(screen.getAllByTestId("responsive-grid-column")).toHaveLength(2);
  });
});
