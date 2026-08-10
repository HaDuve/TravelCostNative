import * as React from "react";
import { Alert } from "react-native";
import { fireEvent, within } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import GetLocalPriceButton from "../../components/Settings/GetLocalPriceButton";
import { renderWithAppProviders } from "../fixtures/app-providers";

const CHEVRON = "›";

describe("GetLocalPriceButton", () => {
  const navigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.mocked(navigation.navigate).mockClear();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.mocked(Alert.alert).mockRestore();
  });

  it("is hidden when Ask AI for good prices is off", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: false } },
      },
    );

    expect(screen.queryByTestId("profile-get-local-price")).toBeNull();
  });

  it("is visible when Ask AI for good prices is on", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    expect(screen.getByTestId("profile-get-local-price")).toBeTruthy();
  });

  it("shows no chevron on the profile trigger row that opens a modal", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    expect(
      within(screen.getByTestId("profile-get-local-price")).queryByText(
        CHEVRON,
      ),
    ).toBeNull();
  });

  it("shows hint text on the profile Local Price row", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    expect(
      screen.getByText("Check prices with AI on the road"),
    ).toBeTruthy();
  });

  it("hides chevrons on modal footer rows", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    fireEvent.press(screen.getByTestId("profile-get-local-price"));

    expect(
      within(screen.getByTestId("get-local-price-submit")).queryByText(
        CHEVRON,
      ),
    ).toBeNull();
    expect(
      within(screen.getByTestId("get-local-price-cancel")).queryByText(
        CHEVRON,
      ),
    ).toBeNull();
  });
});
