jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "de-DE", languageCode: "de" }],
}));

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FittingCurrencyAmount } from "../../components/UI/FittingCurrencyAmount";

function fireFullProbeTextLayout(width: number) {
  fireEvent(
    screen.getByTestId("fitting-currency-full-probe", {
      includeHiddenElements: true,
    }),
    "textLayout",
    {
      nativeEvent: {
        lines: [{ width, height: 20, x: 0, y: 0, ascender: 0, capHeight: 0, descender: 0, xHeight: 0 }],
      },
    }
  );
}

describe("FittingCurrencyAmount", () => {
  it("shows compact currency text when the full amount is wider than the container", () => {
    render(
      <FittingCurrencyAmount
        amount={10_000}
        currency="EUR"
        locale="de"
        testID="fitting-currency"
      />
    );

    fireEvent(screen.getByTestId("fitting-currency"), "layout", {
      nativeEvent: { layout: { width: 40, height: 20, x: 0, y: 0 } },
    });
    fireFullProbeTextLayout(80);

    expect(screen.getByText("10k€")).toBeTruthy();
  });

  it("shows the full currency text when the amount fits the container", () => {
    render(
      <FittingCurrencyAmount
        amount={10_000}
        currency="EUR"
        locale="de"
        testID="fitting-currency"
      />
    );

    fireEvent(screen.getByTestId("fitting-currency"), "layout", {
      nativeEvent: { layout: { width: 120, height: 20, x: 0, y: 0 } },
    });
    fireFullProbeTextLayout(80);

    expect(screen.queryByText("10k€")).toBeNull();
    expect(
      screen.getAllByText(/10\.000/, { includeHiddenElements: true }).length
    ).toBeGreaterThan(0);
  });
});
