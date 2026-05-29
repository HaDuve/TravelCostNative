import {
  applySplitEdit,
  removeFromSplit,
} from "../../util/split";
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

describe("applySplitEdit", () => {
  it("bumps edit order on the edited split, recalculates remainder, and reports validity for EXACT", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 30, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 50 }),
    ];

    const { splitList: result, valid } = applySplitEdit(
      splitList,
      0,
      "A",
      "40",
      100,
      "EXACT"
    );

    expect(result).toEqual([
      makeSplit({ userName: "A", amount: 40, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 2 }),
      makeSplit({ userName: "C", amount: 40 }),
    ]);
    expect(valid).toBe(true);
  });

  it("reports invalid when a split amount is cleared to zero", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 60, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 40, editOrder: 1 }),
    ];

    const { valid } = applySplitEdit(splitList, 0, "A", "", 100, "EXACT");

    expect(valid).toBe(false);
  });
});

describe("removeFromSplit", () => {
  it("returns null when the traveller is not on the split list", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 50 }),
      makeSplit({ userName: "B", amount: 50 }),
    ];

    expect(
      removeFromSplit(splitList, "Z", "Payer", "EXACT", 100, [
        "A",
        "B",
        "Z",
      ])
    ).toBeNull();
  });

  it("falls back to SELF with an empty split list when the last traveller is removed", () => {
    const splitList: Split[] = [makeSplit({ userName: "A", amount: 100 })];

    const result = removeFromSplit(splitList, "A", "Payer", "EXACT", 100, [
      "A",
    ]);

    expect(result).toEqual({
      splitList: [],
      splitType: "SELF",
      valid: true,
    });
  });

  it("falls back to SELF when only the payer remains on the split list", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "Payer", amount: 60 }),
      makeSplit({ userName: "Guest", amount: 40 }),
    ];

    const result = removeFromSplit(
      splitList,
      "Guest",
      "Payer",
      "EXACT",
      100,
      ["Payer", "Guest"]
    );

    expect(result).toEqual({
      splitList: [],
      splitType: "SELF",
      valid: true,
    });
  });

  it("omits valid when EQUAL recalc cannot run (legacy: splitListValid unchanged)", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 50, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 50, editOrder: 1 }),
    ];

    const result = removeFromSplit(
      splitList,
      "A",
      "Payer",
      "EQUAL",
      0,
      ["A", "B"]
    );

    expect(result).toEqual({
      splitList: [makeSplit({ userName: "B", amount: 50 })],
      splitType: "EQUAL",
    });
    expect(result).not.toHaveProperty("valid");
  });

  it("recalculates EQUAL splits for remaining travellers after removal", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 33.33 }),
      makeSplit({ userName: "B", amount: 33.33 }),
      makeSplit({ userName: "C", amount: 33.34 }),
    ];

    const result = removeFromSplit(
      splitList,
      "C",
      "Payer",
      "EQUAL",
      100,
      ["A", "B", "C"]
    );

    expect(result).toEqual({
      splitList: [
        makeSplit({ userName: "A", amount: 50 }),
        makeSplit({ userName: "B", amount: 50 }),
      ],
      splitType: "EQUAL",
      valid: true,
    });
  });

  it("strips edit order and validates EXACT splits after removal", () => {
    const splitList: Split[] = [
      makeSplit({ userName: "A", amount: 40, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 60, editOrder: 1 }),
    ];

    const result = removeFromSplit(
      splitList,
      "B",
      "Payer",
      "EXACT",
      40,
      ["A", "B"]
    );

    expect(result).toEqual({
      splitList: [makeSplit({ userName: "A", amount: 40 })],
      splitType: "EXACT",
      valid: true,
    });
  });
});
