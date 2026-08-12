import * as React from "react";
import { StyleSheet } from "react-native";
import { renderWithAppProviders } from "../fixtures/app-providers";
import ContentFrame from "../../components/layout/ContentFrame";
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
