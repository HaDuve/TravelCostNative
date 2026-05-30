import { act, renderHook } from "@testing-library/react-native";

import { useRangedMode } from "../../hooks/useRangedMode";
import { DuplicateOption } from "../../util/expense";
import { buildRangedDuplOrSplitPromptString } from "../../util/expense-form-range";

function renderRangedMode(
  overrides: Partial<Parameters<typeof useRangedMode>[0]> = {}
) {
  return renderHook(() =>
    useRangedMode({
      isEditing: false,
      ...overrides,
    })
  );
}

describe("useRangedMode", () => {
  it("derives alreadyDivided when editing a ranged split expense", () => {
    const { result } = renderRangedMode({
      isEditing: true,
      initialDuplOrSplit: DuplicateOption.split,
    });

    expect(result.current.mode).toBe("split");
    expect(result.current.duplOrSplit).toBe(DuplicateOption.split);
    expect(result.current.alreadyDividedAmountByDays).toBe(true);
  });

  it("clears alreadyDivided when the user picks ranged split from the range prompt before a mode was set", () => {
    const { result } = renderRangedMode({
      isEditing: true,
      initialDuplOrSplit: DuplicateOption.null,
    });

    act(() => {
      result.current.confirmSplit();
    });

    expect(result.current.mode).toBe("split");
    expect(result.current.alreadyDividedAmountByDays).toBe(false);
  });

  it("keeps alreadyDivided when re-confirming ranged split on an already-divided edit", () => {
    const { result } = renderRangedMode({
      isEditing: true,
      initialDuplOrSplit: DuplicateOption.split,
    });

    act(() => {
      result.current.confirmSplit();
    });

    expect(result.current.alreadyDividedAmountByDays).toBe(true);
  });

  it("restores the total amount when collapsing an already-divided ranged split to one day", () => {
    const { result } = renderRangedMode({
      isEditing: true,
      initialDuplOrSplit: DuplicateOption.split,
    });

    expect(
      result.current.resolveCollapseToSingleDayAmount({
        amount: 50,
        inclusiveDayCount: 3,
      })
    ).toBe("150.00");
  });

  it("stores per-day amount when collapsing a new ranged split to one day", () => {
    const { result } = renderRangedMode({
      isEditing: false,
      initialDuplOrSplit: DuplicateOption.null,
    });

    act(() => {
      result.current.confirmSplit();
    });

    expect(
      result.current.resolveCollapseToSingleDayAmount({
        amount: 150,
        inclusiveDayCount: 3,
      })
    ).toBe("50.00");
  });

  it("requests duplicate/split choice when a multi-day range is confirmed with no mode", () => {
    const { result } = renderRangedMode({ isEditing: false });

    act(() => {
      result.current.onMultiDayRangeConfirmed();
    });

    expect(result.current.shouldPromptForMode).toBe(true);
  });

  it("maps ranged modes to existing DuplicateOption values at the persistence seam", () => {
    const { result } = renderRangedMode({ isEditing: false });

    act(() => {
      result.current.confirmDuplicate();
    });
    expect(result.current.duplOrSplit).toBe(DuplicateOption.duplicate);

    act(() => {
      result.current.confirmSplit();
    });
    expect(result.current.duplOrSplit).toBe(DuplicateOption.split);

    act(() => {
      result.current.clearMode();
    });
    expect(result.current.duplOrSplit).toBe(DuplicateOption.null);
  });

  it("uses split prompt figures that match per-day amounts used when saving", () => {
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
    const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
    const amount = 50;
    const inclusiveDayCount = 3;

    const { result } = renderRangedMode({
      isEditing: true,
      initialDuplOrSplit: DuplicateOption.split,
    });

    const splitPrompt = buildRangedDuplOrSplitPromptString(2, {
      amount,
      inclusiveDayCount,
      alreadyDividedAmountByDays: result.current.alreadyDividedAmountByDays,
      formatAmount,
      labels: promptLabels,
    });

    expect(splitPrompt).toBe(
      "Splitting up the $150.00\nover 3 days, each $50.00"
    );

    const duplicatePrompt = buildRangedDuplOrSplitPromptString(1, {
      amount,
      inclusiveDayCount,
      alreadyDividedAmountByDays: result.current.alreadyDividedAmountByDays,
      formatAmount,
      labels: promptLabels,
    });

    expect(duplicatePrompt).toBe(
      "Duplicating $50.00 over 3 days. \nResulting in a $150.00 Total"
    );
  });
});
