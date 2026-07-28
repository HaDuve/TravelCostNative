jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "de-DE", languageCode: "de" }],
}));

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  FittingCurrencyAmountPair,
  pickFittingCurrencyPairDisplay,
} from "../../components/UI/FittingCurrencyAmount";

function firePairProbeTextLayout(width: number) {
  fireEvent(
    screen.getByTestId("fitting-currency-pair-full-probe", {
      includeHiddenElements: true,
    }),
    "textLayout",
    {
      nativeEvent: {
        lines: [
          {
            width,
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
}

describe("pickFittingCurrencyPairDisplay", () => {
  it("uses compact for both when combined full spent/budget overflows the row", () => {
    const result = pickFittingCurrencyPairDisplay(
      10_000,
      20_000,
      "EUR",
      "de",
      150,
      200
    );

    expect(result.spentText).toBe("10k€");
    expect(result.budgetText).toBe("20k€");
  });

  it("uses full formatting when combined width fits the row", () => {
    const result = pickFittingCurrencyPairDisplay(
      10_000,
      20_000,
      "EUR",
      "de",
      200,
      150
    );

    expect(result.spentText).toMatch(/10\.000/);
    expect(result.budgetText).toMatch(/20\.000/);
  });
});

describe("FittingCurrencyAmountPair", () => {
  it("shows compact spent/budget when the trip amount row is too narrow", () => {
    render(
      <FittingCurrencyAmountPair
        spent={10_000}
        budget={20_000}
        currency="EUR"
        locale="de"
        textStyle={{ fontSize: 12, fontWeight: "bold" }}
        testID="fitting-currency-pair"
      />
    );

    fireEvent(screen.getByTestId("fitting-currency-pair"), "layout", {
      nativeEvent: { layout: { width: 150, height: 20, x: 0, y: 0 } },
    });
    firePairProbeTextLayout(200);

    expect(screen.getByText("10k€")).toBeTruthy();
    expect(screen.getByText("20k€")).toBeTruthy();
  });
});
