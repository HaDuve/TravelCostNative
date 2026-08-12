import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

import ActionRowStack from "../../components/UI/ActionRowStack";
import LayoutContextProvider from "../../store/layout-context";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderActionRowStackAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <ActionRowStack
        actions={[
          {
            testID: "sample-action",
            label: "Add expense",
            onPress: jest.fn(),
            tier: "primary",
          },
        ]}
      />
    </LayoutContextProvider>,
    { wrapNavigation: false }
  );
}

describe("ActionRowStack layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps actions full width on narrow phones", () => {
    const screen = renderActionRowStackAt(390, 844);
    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("action-row-stack-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.alignSelf).toBe("stretch");
    expect(frameStyle.maxWidth).toBeUndefined();
  });

  it("constrains actions on wide viewports", () => {
    const screen = renderActionRowStackAt(1024, 768);
    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("action-row-stack-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.maxWidth).toBe(480);
    expect(frameStyle.alignSelf).toBe("center");
    expect(frameStyle.minHeight).toBe(44);
    expect(frameStyle.minWidth).toBe(44);
  });
});
