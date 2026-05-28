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

  it("negative remainder: oldest edited splits are reduced, most-recent (editOrder=0) is preserved", () => {
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

  it("all splits edited: remainder is distributed among oldest edited splits", () => {
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

