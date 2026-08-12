import * as React from "react";
import { StyleSheet } from "react-native";
import { renderWithAppProviders } from "../fixtures/app-providers";
import ContentFrame, { ControlFrame } from "../../components/layout/ContentFrame";
import { layoutFor } from "../../util/layout";

describe("ContentFrame", () => {
  it("centers content with an 800px max width and layout spacing padding", () => {
    const layout = layoutFor({ width: 1024, height: 768 });
    const screen = renderWithAppProviders(
      <ContentFrame testID="content-frame" layout={layout}>
        <></>
      </ContentFrame>,
      { wrapNavigation: false }
    );

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("content-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.maxWidth).toBe(800);
    expect(frameStyle.alignSelf).toBe("center");
    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.paddingHorizontal).toBe(layout.space(3));
  });
});

describe("ControlFrame", () => {
  it("constrains wide fill controls to the layout control max width", () => {
    const layout = layoutFor({ width: 1024, height: 768 });
    const screen = renderWithAppProviders(
      <ControlFrame testID="control-frame" layout={layout}>
        <></>
      </ControlFrame>,
      { wrapNavigation: false }
    );

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("control-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.maxWidth).toBe(480);
    expect(frameStyle.alignSelf).toBe("center");
    expect(frameStyle.minHeight).toBe(44);
    expect(frameStyle.minWidth).toBe(44);
  });

  it("keeps narrow fill controls full width", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    const screen = renderWithAppProviders(
      <ControlFrame testID="control-frame" layout={layout}>
        <></>
      </ControlFrame>,
      { wrapNavigation: false }
    );

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("control-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.alignSelf).toBe("stretch");
    expect(frameStyle.maxWidth).toBeUndefined();
  });
});
