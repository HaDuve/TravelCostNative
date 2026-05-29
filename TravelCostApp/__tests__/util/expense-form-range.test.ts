import { DuplicateOption } from "../../util/expense";
import {
  buildRangedDuplicatePromptString,
  buildRangedDuplOrSplitPromptString,
  buildRangedSplitPromptString,
  countInclusiveDaysInRange,
  divideAmountForRangedSplit,
  formatRangedAmountFieldValue,
  multiplyAmountForRangedDuplicate,
  resolveAlreadyDividedAmountByDays,
  resolveAmountWhenCollapsingRangeToSingleDay,
} from "../../util/expense-form-range";

describe("multiplyAmountForRangedDuplicate", () => {
  it("multiplies per-day amount across an inclusive multi-day span", () => {
    expect(multiplyAmountForRangedDuplicate(50, 3)).toBe(150);
  });
});

describe("divideAmountForRangedSplit", () => {
  it("spreads total amount evenly per day for a multi-day span", () => {
    expect(divideAmountForRangedSplit(150, 3)).toBe(50);
  });
});

describe("countInclusiveDaysInRange", () => {
  it("returns 1 for a single-day span", () => {
    const day = new Date("2026-01-15T12:00:00.000Z");
    expect(
      countInclusiveDaysInRange(day, day)
    ).toBe(1);
  });

  it("counts inclusive days across a multi-day span", () => {
    const start = new Date("2026-01-15T12:00:00.000Z");
    const end = new Date("2026-01-17T12:00:00.000Z");
    expect(countInclusiveDaysInRange(start, end)).toBe(3);
  });
});

describe("resolveAlreadyDividedAmountByDays", () => {
  it("is true when editing a ranged-split expense", () => {
    expect(
      resolveAlreadyDividedAmountByDays(true, DuplicateOption.split, false)
    ).toBe(true);
  });

  it("is false for a new ranged-split expense", () => {
    expect(
      resolveAlreadyDividedAmountByDays(false, DuplicateOption.split, false)
    ).toBe(false);
  });

  it("is false after the user picks split from the range prompt", () => {
    expect(
      resolveAlreadyDividedAmountByDays(true, DuplicateOption.split, true)
    ).toBe(false);
  });
});

describe("formatRangedAmountFieldValue", () => {
  it("formats to two decimal places as a string", () => {
    expect(formatRangedAmountFieldValue(10.5)).toBe("10.50");
  });
});

describe("resolveAmountWhenCollapsingRangeToSingleDay", () => {
  it("restores total when editing a ranged-split expense", () => {
    expect(
      resolveAmountWhenCollapsingRangeToSingleDay({
        amount: 50,
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.split,
        alreadyDividedAmountByDays: true,
      })
    ).toBe("150.00");
  });

  it("stores per-day amount when collapsing a new ranged-split expense", () => {
    expect(
      resolveAmountWhenCollapsingRangeToSingleDay({
        amount: 150,
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.split,
        alreadyDividedAmountByDays: false,
      })
    ).toBe("50.00");
  });

  it("returns null when duplOrSplit is not split", () => {
    expect(
      resolveAmountWhenCollapsingRangeToSingleDay({
        amount: 50,
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.duplicate,
        alreadyDividedAmountByDays: false,
      })
    ).toBeNull();
  });
});

const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

const promptLabels = {
  duplString1: "Duplicating",
  duplString2: "over",
  duplString3: "days",
  duplString4: "Resulting in a",
  splitString1: "Splitting up the",
  splitString2: "over",
  splitString3: "days, each",
  total: "Total",
};

describe("buildRangedDuplicatePromptString", () => {
  it("describes per-day duplicate over a multi-day span", () => {
    expect(
      buildRangedDuplicatePromptString({
        amount: 50,
        inclusiveDayCount: 3,
        formatAmount,
        labels: promptLabels,
      })
    ).toBe(
      "Duplicating $50.00 over 3 days. \nResulting in a $150.00 Total"
    );
  });
});

describe("buildRangedSplitPromptString", () => {
  it("describes per-day split for a new ranged expense", () => {
    expect(
      buildRangedSplitPromptString({
        amount: 150,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: false,
        formatAmount,
        labels: promptLabels,
      })
    ).toBe(
      "Splitting up the $150.00\nover 3 days, each $50.00"
    );
  });

  it("describes per-day split when editing an already-divided ranged expense", () => {
    expect(
      buildRangedSplitPromptString({
        amount: 50,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: true,
        formatAmount,
        labels: promptLabels,
      })
    ).toBe(
      "Splitting up the $150.00\nover 3 days, each $50.00"
    );
  });
});

describe("buildRangedDuplOrSplitPromptString", () => {
  it("returns duplicate or split prompt for the chosen option", () => {
    expect(
      buildRangedDuplOrSplitPromptString(1, {
        amount: 50,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: false,
        formatAmount,
        labels: promptLabels,
      })
    ).toContain("Duplicating $50.00");

    expect(
      buildRangedDuplOrSplitPromptString(2, {
        amount: 150,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: false,
        formatAmount,
        labels: promptLabels,
      })
    ).toContain("days, each $50.00");

    expect(
      buildRangedDuplOrSplitPromptString(0, {
        amount: 50,
        inclusiveDayCount: 1,
        alreadyDividedAmountByDays: false,
        formatAmount,
        labels: promptLabels,
      })
    ).toBe("");
  });
});
