import * as React from "react";
import { Alert } from "react-native";
import { fireEvent, within } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/Currency/CurrencyPicker", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockCurrencyPicker({
    countryValue,
    setCountryValue,
  }: {
    countryValue?: string;
    setCountryValue?: (value: string) => void;
  }) {
    return React.createElement(
      Pressable,
      {
        testID: "get-local-price-currency-picker",
        onPress: () => setCountryValue?.("THB | ฿"),
      },
      React.createElement(Text, null, countryValue ?? ""),
    );
  };
});

jest.mock("../../components/Currency/CountryPicker", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockCountryPicker({
    countryValue,
    setCountryValue,
  }: {
    countryValue?: string;
    setCountryValue?: (value: string) => void;
  }) {
    return React.createElement(
      Pressable,
      {
        testID: "get-local-price-country-picker",
        onPress: () => setCountryValue?.("Thailand - ไทย"),
      },
      React.createElement(Text, null, countryValue ?? ""),
    );
  };
});

jest.mock("../../components/UI/DatePickerContainer", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockDatePickerContainer({
    openDatePickerRange,
  }: {
    openDatePickerRange?: () => void;
  }) {
    return React.createElement(
      Pressable,
      {
        testID: "get-local-price-date-picker",
        onPress: openDatePickerRange,
      },
      React.createElement(Text, null, "date-range"),
    );
  };
});

jest.mock("../../components/UI/DatePickerModal", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockDatePickerModal({
    onConfirmRange,
  }: {
    onConfirmRange?: (expenseOut: {
      startDate: Date;
      endDate: Date;
    }) => void;
  }) {
    return React.createElement(
      Pressable,
      {
        testID: "get-local-price-confirm-date-range",
        onPress: () =>
          onConfirmRange?.({
            startDate: new Date("2026-08-01T12:00:00.000Z"),
            endDate: new Date("2026-08-07T12:00:00.000Z"),
          }),
      },
      React.createElement(Text, null, "confirm-range"),
    );
  };
});

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

  it("shows optional advanced controls collapsed by default", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    fireEvent.press(screen.getByTestId("profile-get-local-price"));

    expect(screen.getByText("Show more options")).toBeTruthy();
    expect(screen.queryByTestId("get-local-price-advanced-options")).toBeNull();
  });

  it("reveals country, currency, and date range when advanced options expand", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    fireEvent.press(screen.getByTestId("profile-get-local-price"));
    fireEvent.press(screen.getByTestId("get-local-price-advanced-toggle"));

    expect(screen.getByTestId("get-local-price-advanced-options")).toBeTruthy();
    expect(screen.getByTestId("get-local-price-currency-picker")).toBeTruthy();
    expect(screen.getByTestId("get-local-price-country-picker")).toBeTruthy();
    expect(screen.getByTestId("get-local-price-date-picker")).toBeTruthy();
  });

  it("navigates with defaults when advanced options stay collapsed", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        user: { lastCountry: "Germany", lastCurrency: "EUR" },
        trip: { tripCurrency: "USD" },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    fireEvent.press(screen.getByTestId("profile-get-local-price"));
    fireEvent.changeText(
      screen.getByPlaceholderText(
        "e.g., Coffee, Coworking space, Apartment rental...",
      ),
      "Coffee",
    );
    fireEvent.press(screen.getByTestId("get-local-price-submit"));

    expect(navigation.navigate).toHaveBeenCalledWith("GPTDeal", {
      product: "Coffee",
      country: "Germany",
      currency: "EUR",
      inclusiveDayCount: 1,
      price: "",
    });
  });

  it("navigates with advanced country, currency, and date range when expanded", () => {
    const screen = renderWithAppProviders(
      <GetLocalPriceButton navigation={navigation as any} />,
      {
        wrapNavigation: false,
        network: { isConnected: true },
        user: { lastCountry: "Germany", lastCurrency: "EUR" },
        settings: { settings: { askAiForGoodPrices: true } },
      },
    );

    fireEvent.press(screen.getByTestId("profile-get-local-price"));
    fireEvent.changeText(
      screen.getByPlaceholderText(
        "e.g., Coffee, Coworking space, Apartment rental...",
      ),
      "Apartment rental",
    );
    fireEvent.press(screen.getByTestId("get-local-price-advanced-toggle"));
    fireEvent.press(screen.getByTestId("get-local-price-currency-picker"));
    fireEvent.press(screen.getByTestId("get-local-price-country-picker"));
    fireEvent.press(screen.getByTestId("get-local-price-date-picker"));
    fireEvent.press(screen.getByTestId("get-local-price-confirm-date-range"));
    fireEvent.press(screen.getByTestId("get-local-price-submit"));

    expect(navigation.navigate).toHaveBeenCalledWith("GPTDeal", {
      product: "Apartment rental",
      country: "Thailand",
      currency: "THB",
      inclusiveDayCount: 7,
      price: "",
    });
  });
});
