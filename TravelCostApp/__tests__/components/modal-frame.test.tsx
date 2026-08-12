import * as React from "react";
import { StyleSheet } from "react-native";
import { renderWithAppProviders } from "../fixtures/app-providers";
import ModalFrame from "../../components/layout/ModalFrame";
import { layoutFor } from "../../util/layout";

describe("ModalFrame", () => {
  it("uses full width on narrow viewports", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    const screen = renderWithAppProviders(
      <ModalFrame testID="modal-frame" layout={layout}>
        <></>
      </ModalFrame>,
      { wrapNavigation: false }
    );

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("modal-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.alignSelf).toBeUndefined();
  });

  it("centers modal content with a max width once the modal breakpoint is wide", () => {
    const layout = layoutFor({ width: 700, height: 900 });
    const screen = renderWithAppProviders(
      <ModalFrame testID="modal-frame" layout={layout}>
        <></>
      </ModalFrame>,
      { wrapNavigation: false }
    );

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("modal-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.width).toBe("100%");
    expect(frameStyle.maxWidth).toBe(600);
    expect(frameStyle.alignSelf).toBe("center");
  });
});
