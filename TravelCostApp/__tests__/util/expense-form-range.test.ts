jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en" }],
}));

import { i18n } from "../../i18n/i18n";
import { DuplicateOption } from "../../util/expense";
import { formatExpenseWithCurrency } from "../../util/string";
import {
  buildRangedDuplicatePromptString,
  buildRangedDuplOrSplitPromptString,
  buildRangedSplitPromptString,
  countInclusiveDaysInRange,
  distributeRangedAmount,
  divideAmountForRangedSplit,
  formatRangedAmountFieldValue,
  multiplyAmountForRangedDuplicate,
  resolveAlreadyDividedAmountByDays,
  resolveAmountWhenCollapsingRangeToSingleDay,
} from "../../util/expense-form-range";

describe("distributeRangedAmount", () => {
  it("spreads a ranged-split total evenly per day across an inclusive span", () => {
    expect(
      distributeRangedAmount({
        total: 150,
        dayCount: 3,
        mode: DuplicateOption.split,
        alreadyDivided: false,
      })
    ).toBe(50);
  });

  it("keeps the full per-day amount for ranged duplicate", () => {
    expect(
      distributeRangedAmount({
        total: 50,
        dayCount: 3,
        mode: DuplicateOption.duplicate,
        alreadyDivided: false,
      })
    ).toBe(50);
  });

  it("short-circuits when the amount is already a per-day share", () => {
    expect(
      distributeRangedAmount({
        total: 50,
        dayCount: 3,
        mode: DuplicateOption.split,
        alreadyDivided: true,
      })
    ).toBe(50);
  });

  it("rounds ranged-split per-day amounts to two decimal places", () => {
    expect(
      distributeRangedAmount({
        total: 100,
        dayCount: 3,
        mode: DuplicateOption.split,
        alreadyDivided: false,
      })
    ).toBe(33.33);
  });

  it("documents rounding drift when summing per-day ranged-split shares", () => {
    const dayCount = 3;
    const total = 100;
    const perDay = distributeRangedAmount({
      total,
      dayCount,
      mode: DuplicateOption.split,
      alreadyDivided: false,
    });

    expect(perDay).toBe(33.33);
    expect(Number((perDay * dayCount).toFixed(2))).toBe(99.99);
    expect(perDay * dayCount).not.toBe(total);
  });
});

describe("multiplyAmountForRangedDuplicate", () => {
  it("leaves amount unchanged for a single-day span", () => {
    expect(multiplyAmountForRangedDuplicate(50, 1)).toBe(50);
  });

  it("multiplies per-day amount across an inclusive multi-day span", () => {
    expect(multiplyAmountForRangedDuplicate(50, 3)).toBe(150);
  });
});

describe("divideAmountForRangedSplit", () => {
  it("leaves amount unchanged for a single-day span", () => {
    expect(divideAmountForRangedSplit(50, 1)).toBe(50);
  });

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
    const splitInput = {
      amount: 150,
      inclusiveDayCount: 3,
      alreadyDividedAmountByDays: false,
      formatAmount,
      labels: promptLabels,
    };

    expect(
      buildRangedDuplOrSplitPromptString(1, {
        amount: 50,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: false,
        formatAmount,
        labels: promptLabels,
      })
    ).toBe(
      "Duplicating $50.00 over 3 days. \nResulting in a $150.00 Total"
    );

    expect(buildRangedDuplOrSplitPromptString(2, splitInput)).toBe(
      buildRangedSplitPromptString(splitInput)
    );

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

function englishRangedPromptLabels() {
  return {
    duplString1: i18n.t("duplString1"),
    duplString2: i18n.t("duplString2"),
    duplString3: i18n.t("duplString3"),
    duplString4: i18n.t("duplString4"),
    splitString1: i18n.t("splitString1"),
    splitString2: i18n.t("splitString2"),
    splitString3: i18n.t("splitString3"),
    total: i18n.t("total"),
  };
}

describe("ranged prompts with formatExpenseWithCurrency", () => {
  beforeAll(() => {
    i18n.locale = "en";
  });

  const formatEur = (amount: number) => formatExpenseWithCurrency(amount, "EUR");

  it("matches ExpenseForm duplicate prompt formatting for EUR", () => {
    expect(
      buildRangedDuplicatePromptString({
        amount: 50,
        inclusiveDayCount: 3,
        formatAmount: formatEur,
        labels: englishRangedPromptLabels(),
      })
    ).toBe("Duplicating €50 over 3 days. \nResulting in a €150 Total");
  });

  it("matches ExpenseForm split prompt formatting for EUR (new ranged expense)", () => {
    expect(
      buildRangedSplitPromptString({
        amount: 150,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: false,
        formatAmount: formatEur,
        labels: englishRangedPromptLabels(),
      })
    ).toBe("Splitting up the €150\nover 3 days, each €50");
  });

  it("matches ExpenseForm split prompt formatting for EUR (editing ranged split)", () => {
    expect(
      buildRangedSplitPromptString({
        amount: 50,
        inclusiveDayCount: 3,
        alreadyDividedAmountByDays: true,
        formatAmount: formatEur,
        labels: englishRangedPromptLabels(),
      })
    ).toBe("Splitting up the €150\nover 3 days, each €50");
  });
});
