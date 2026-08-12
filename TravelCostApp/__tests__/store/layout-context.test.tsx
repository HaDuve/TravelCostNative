import * as React from "react";
import { Dimensions, Text } from "react-native";
import { act, render } from "@testing-library/react-native";

import LayoutContextProvider, {
  useLayoutProfile,
} from "../../store/layout-context";

function BreakpointProbe() {
  const layout = useLayoutProfile();
  return <Text testID="layout-breakpoint">{layout.breakpoint}</Text>;
}

describe("LayoutContextProvider", () => {
  const dimensionListeners: Array<(event: { window: { width: number; height: number } }) => void> = [];

  beforeEach(() => {
    dimensionListeners.length = 0;
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });
    jest.spyOn(Dimensions, "addEventListener").mockImplementation((_event, listener) => {
      dimensionListeners.push(listener as typeof dimensionListeners[number]);
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("recomputes the layout profile when window dimensions change", () => {
    const screen = render(
      <LayoutContextProvider>
        <BreakpointProbe />
      </LayoutContextProvider>
    );

    expect(screen.getByTestId("layout-breakpoint")).toHaveTextContent("narrow");

    act(() => {
      jest.spyOn(Dimensions, "get").mockReturnValue({
        width: 1024,
        height: 768,
        scale: 2,
        fontScale: 2,
      });
      dimensionListeners.forEach((listener) =>
        listener({ window: { width: 1024, height: 768 } })
      );
    });

    expect(screen.getByTestId("layout-breakpoint")).toHaveTextContent("wide");
  });
});
