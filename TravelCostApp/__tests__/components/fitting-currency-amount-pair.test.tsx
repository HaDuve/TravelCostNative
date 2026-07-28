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

  it("shows ∞ for total budget on a budget-free trip", () => {
    const result = pickFittingCurrencyPairDisplay(
      10_000,
      0,
      "EUR",
      "de",
      200,
      150,
      { noBudget: true }
    );

    expect(result.spentText).toMatch(/10\.000/);
    expect(result.budgetText).toBe("∞");
  });

  it("uses compact trip total spent with ∞ when the pair overflows", () => {
    const result = pickFittingCurrencyPairDisplay(
      10_000,
      0,
      "EUR",
      "de",
      150,
      200,
      { noBudget: true }
    );

    expect(result.spentText).toBe("10k€");
    expect(result.budgetText).toBe("∞");
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

  it("shows full spent/budget when the row is wide enough", () => {
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
      nativeEvent: { layout: { width: 200, height: 20, x: 0, y: 0 } },
    });
    firePairProbeTextLayout(150);

    expect(screen.queryByText("10k€")).toBeNull();
    expect(screen.queryByText("20k€")).toBeNull();
    expect(
      screen.getAllByText(/10\.000/, { includeHiddenElements: true }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/20\.000/, { includeHiddenElements: true }).length
    ).toBeGreaterThan(0);
  });

  it("shows ∞ for total budget when the trip has no total budget", () => {
    render(
      <FittingCurrencyAmountPair
        spent={10_000}
        budget={0}
        currency="EUR"
        locale="de"
        noBudget
        textStyle={{ fontSize: 12, fontWeight: "bold" }}
        testID="fitting-currency-pair"
      />
    );

    fireEvent(screen.getByTestId("fitting-currency-pair"), "layout", {
      nativeEvent: { layout: { width: 200, height: 20, x: 0, y: 0 } },
    });
    firePairProbeTextLayout(150);

    expect(screen.getByText("∞")).toBeTruthy();
    expect(screen.queryByText("10k€")).toBeNull();
  });
});
