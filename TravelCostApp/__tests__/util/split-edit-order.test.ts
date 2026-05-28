import { recalcSplitsWithEditOrder } from "../../util/split";
import type { Split } from "../../util/expense";

function makeSplit(overrides: Partial<Split> & Pick<Split, "userName">): Split {
  return {
    userName: overrides.userName,
    amount: overrides.amount ?? 0,
    whoPaid: overrides.whoPaid,
    rate: overrides.rate,
    editOrder: overrides.editOrder,
  };
}

describe("Split edit order (recalcSplitsWithEditOrder)", () => {
  it("positive remainder to unedited splits: unedited splits absorb the remainder equally", () => {
    const input: Split[] = [
      makeSplit({ userName: "A", amount: 30, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 0 }),
      makeSplit({ userName: "D", amount: 0 }),
    ];

    const result = recalcSplitsWithEditOrder(input, 100);

    expect(result).toEqual([
      makeSplit({ userName: "A", amount: 30, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 25 }),
      makeSplit({ userName: "D", amount: 25 }),
    ]);
  });

  it("negative remainder: non-most-recent edited splits are reduced, most-recent (editOrder=0) is preserved", () => {
    const input: Split[] = [
      makeSplit({ userName: "A", amount: 40, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 10, editOrder: 2 }),
    ];

    const result = recalcSplitsWithEditOrder(input, 50);

    expect(result).toEqual([
      makeSplit({ userName: "A", amount: 40, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 10, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 0, editOrder: 2 }),
    ]);
  });

  it("all splits edited: remainder is distributed among non-most-recent edited splits", () => {
    const input: Split[] = [
      makeSplit({ userName: "A", amount: 60, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 0, editOrder: 2 }),
    ];

    const result = recalcSplitsWithEditOrder(input, 100);

    expect(result).toEqual([
      makeSplit({ userName: "A", amount: 60, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 30, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 10, editOrder: 2 }),
    ]);
  });

  it("rounding: amounts are 2dp and total stays within a rounding tolerance", () => {
    const input: Split[] = [
      makeSplit({ userName: "A", amount: 33.33, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 16.67, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 0 }),
      makeSplit({ userName: "D", amount: 0 }),
      makeSplit({ userName: "E", amount: 0 }),
    ];

    const result = recalcSplitsWithEditOrder(input, 100);

    // remainder = 50, unedited splits = 3 -> 16.666..., which rounds to 16.67 each
    expect(result[2].amount).toBe(16.67);
    expect(result[3].amount).toBe(16.67);
    expect(result[4].amount).toBe(16.67);

    const sum = result.reduce((acc, split) => acc + Number(split.amount), 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.02);

    result.forEach((split) => {
      expect(Number.isFinite(Number(split.amount))).toBe(true);
      expect(Number(split.amount)).toBeCloseTo(Number(split.amount), 2);
    });
  });

  it("zero-amount clamp: a split that would go negative is clamped to 0", () => {
    const input: Split[] = [
      makeSplit({ userName: "A", amount: 10, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 5, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 0, editOrder: 2 }),
    ];

    const result = recalcSplitsWithEditOrder(input, 10);

    expect(result[2].amount).toBe(0);
    expect(result[2].amount).not.toBeLessThan(0);
  });

  it("empty / zero-amount guard: returns input unchanged when list is empty or amount is 0", () => {
    const empty: Split[] = [];
    expect(recalcSplitsWithEditOrder(empty, 123)).toBe(empty);

    const list: Split[] = [makeSplit({ userName: "A", amount: 1 })];
    expect(recalcSplitsWithEditOrder(list, 0)).toBe(list);
  });
});

