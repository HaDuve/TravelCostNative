jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "de-DE", languageCode: "de" }],
}));

jest.mock("../../i18n/i18n", () => ({
  i18n: { locale: "de", t: (k: string) => k },
}));

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import CurrencyTicker from "../../components/UI/AnimatedNumber/CurrencyTicker";

describe("CurrencyTicker fitting", () => {
  it("shows compact trip-currency text when the full amount overflows the container", () => {
    render(
      <CurrencyTicker
        value={10_000}
        currency="EUR"
        fontSize={32}
        disableAnimation
        testID="currency-ticker"
      />
    );

    fireEvent(screen.getByTestId("currency-ticker"), "layout", {
      nativeEvent: { layout: { width: 40, height: 20, x: 0, y: 0 } },
    });
    fireEvent(
      screen.getByTestId("currency-ticker-full-probe", {
        includeHiddenElements: true,
      }),
      "textLayout",
      {
        nativeEvent: {
          lines: [
            {
              width: 80,
              height: 20,
              x: 0,
              y: 0,
              ascender: 0,
              capHeight: 0,
              descender: 0,
              xHeight: 0,
            },
          ],
        },
      }
    );

    expect(screen.getByText("10k€")).toBeTruthy();
  });
});
