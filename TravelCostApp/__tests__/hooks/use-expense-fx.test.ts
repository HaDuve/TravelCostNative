import { renderHook, waitFor } from "@testing-library/react-native";

import { useExpenseFx } from "../../hooks/useExpenseFx";
import type { Split } from "../../util/expense";

function makeSplit(overrides: Partial<Split> & Pick<Split, "userName">): Split {
  return {
    userName: overrides.userName,
    amount: overrides.amount ?? 50,
    rate: overrides.rate,
  };
}

describe("useExpenseFx", () => {
  it("computes trip-currency calcAmount when expense currency differs", async () => {
    const getRate = jest.fn(async () => 2);
    const { result } = renderHook(() =>
      useExpenseFx({
        tripCurrency: "USD",
        expenseCurrency: "EUR",
        amountValue: 100,
        splitList: [],
        getRate,
      })
    );

    await waitFor(() => {
      expect(result.current.calcAmount).toBe("50.00");
    });
    expect(getRate).toHaveBeenCalledWith("USD", "EUR");
  });

  it("clears converted amounts when rate is unavailable or trip currency matches", async () => {
    const getRateUnavailable = jest.fn(async () => -1);
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useExpenseFx>[0]) => useExpenseFx(props),
      {
        initialProps: {
          tripCurrency: "USD",
          expenseCurrency: "EUR",
          amountValue: 100,
          splitList: [],
          getRate: getRateUnavailable,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.calcAmount).toBe("");
      expect(result.current.splitListCalcAmounts).toEqual([""]);
    });

    rerender({
      tripCurrency: "USD",
      expenseCurrency: "USD",
      amountValue: 100,
      splitList: [],
      getRate: jest.fn(async () => 1),
    });

    await waitFor(() => {
      expect(result.current.calcAmount).toBe("");
    });
  });

  it("mutates split.rate in place and exposes per-split converted amounts", async () => {
    const splitList = [
      makeSplit({ userName: "A", amount: 100 }),
      makeSplit({ userName: "B", amount: 50 }),
    ];
    const getRate = jest.fn(async () => 2);

    const { result } = renderHook(() =>
      useExpenseFx({
        tripCurrency: "USD",
        expenseCurrency: "EUR",
        amountValue: 100,
        splitList,
        getRate,
      })
    );

    await waitFor(() => {
      expect(result.current.splitListCalcAmounts).toEqual(["50.00", "25.00"]);
    });

    expect(splitList[0].rate).toBe(2);
    expect(splitList[1].rate).toBe(2);
  });
});
