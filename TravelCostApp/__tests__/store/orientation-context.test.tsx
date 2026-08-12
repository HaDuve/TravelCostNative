import * as React from "react";
import { Dimensions, Text } from "react-native";

import LayoutContextProvider from "../../store/layout-context";
import OrientationContextProvider, {
  OrientationContext,
} from "../../store/orientation-context";
import { renderWithAppProviders } from "../fixtures/app-providers";

function Probe() {
  const orientation = React.useContext(OrientationContext);
  return (
    <Text testID="orientation-probe">
      {orientation.orientation}:{orientation.isTablet ? "tablet" : "phone"}:
      {orientation.isPortrait ? "portrait" : "landscape"}
    </Text>
  );
}

describe("OrientationContext adapter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("derives tablet and orientation flags from the layout profile", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 700,
      height: 900,
      scale: 2,
      fontScale: 2,
    });

    const screen = renderWithAppProviders(
      <LayoutContextProvider>
        <OrientationContextProvider>
          <Probe />
        </OrientationContextProvider>
      </LayoutContextProvider>,
      {
        wrapNavigation: false,
      }
    );

    expect(screen.getByTestId("orientation-probe")).toHaveTextContent(
      "PORTRAIT:tablet:portrait"
    );
  });
});
