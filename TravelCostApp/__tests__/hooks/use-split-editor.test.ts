import { act, renderHook } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { useSplitEditor } from "../../hooks/useSplitEditor";
import type { Split } from "../../util/expense";
import {
  applySplitEdit,
  calcSplitList,
  recalcSplitsWithEditOrder,
  resetEditOrder,
  validateSplitList,
  validateSplitListWithEditOrder,
  type splitType,
} from "../../util/split";
import { divideAmountForRangedSplit } from "../../util/expense-form-range";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
  NotificationFeedbackType: { Success: "Success" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

function makeSplit(overrides: Partial<Split> & Pick<Split, "userName">): Split {
  return {
    userName: overrides.userName,
    amount: overrides.amount ?? 0,
    editOrder: overrides.editOrder,
  };
}

function renderSplitEditor(
  overrides: Partial<Parameters<typeof useSplitEditor>[0]> = {}
) {
  return renderHook(() =>
    useSplitEditor({
      initialSplitList: [
        makeSplit({ userName: "A", amount: 30, editOrder: 0 }),
        makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
        makeSplit({ userName: "C", amount: 50 }),
      ],
      initialSplitType: "EXACT",
      initialSplitTravellersList: ["A", "B", "C"],
      amount: 100,
      whoPaid: "Payer",
      tripTravellerNames: ["A", "B", "C"],
      onAutosave: jest.fn(),
      ...overrides,
    })
  );
}

describe("useSplitEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates splitList and splitListValid when a split amount is edited", () => {
    const initialSplitList = resetEditOrder([
      makeSplit({ userName: "A", amount: 30, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 20, editOrder: 1 }),
      makeSplit({ userName: "C", amount: 50 }),
    ]);
    const { splitList: expectedList, valid } = applySplitEdit(
      initialSplitList,
      0,
      "A",
      "40",
      100,
      "EXACT"
    );
    const { result } = renderSplitEditor({ initialSplitList });

    act(() => {
      result.current.inputSplitListHandler(0, { userName: "A" }, "40");
    });

    expect(result.current.splitList).toEqual(expectedList);
    expect(result.current.splitListValid).toBe(valid);
  });

  it("removes a traveller from the split list and fires success haptics", () => {
    const { result } = renderSplitEditor({
      initialSplitList: [
        makeSplit({ userName: "A", amount: 40, editOrder: 0 }),
        makeSplit({ userName: "B", amount: 60, editOrder: 1 }),
      ],
      amount: 40,
    });

    act(() => {
      result.current.removeUserFromSplit("B");
    });

    expect(result.current.splitList).toEqual([
      makeSplit({ userName: "A", amount: 40 }),
    ]);
    expect(result.current.splitType).toBe("EXACT");
    expect(result.current.splitListValid).toBe(true);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
  });

  it("setSplitType updates split type, tracks analytics, and autosaves", () => {
    const onAutosave = jest.fn();
    const { result } = renderSplitEditor({ onAutosave });

    act(() => {
      result.current.setSplitType("EQUAL" as splitType);
    });

    expect(result.current.splitType).toBe("EQUAL");
    expect(trackEvent).toHaveBeenCalledWith(VexoEvents.SPLIT_TYPE_SELECTED, {
      splitType: "EQUAL",
    });
    expect(onAutosave).toHaveBeenCalled();
  });

  it("falls back to SELF on remove without split-type analytics", () => {
    const { result } = renderSplitEditor({
      initialSplitList: [makeSplit({ userName: "A", amount: 100 })],
      initialSplitType: "EXACT",
      amount: 100,
      tripTravellerNames: ["A"],
    });

    act(() => {
      result.current.removeUserFromSplit("A");
    });

    expect(result.current.splitType).toBe("SELF");
    expect(result.current.splitList).toEqual([]);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("setSplitTravellersList updates travellers used by splitHandler", () => {
    const { result } = renderSplitEditor({
      initialSplitList: [],
      initialSplitType: "SELF",
      initialSplitTravellersList: ["A"],
      amount: 100,
      whoPaid: "Payer",
    });

    act(() => {
      result.current.setSplitTravellersList(["A", "B", "C"]);
    });
    act(() => {
      result.current.splitHandler("EQUAL");
    });

    expect(result.current.splitTravellersList).toEqual(["A", "B", "C"]);
    const expectedList = resetEditOrder(
      calcSplitList("EQUAL", 100, "Payer", ["A", "B", "C"])!
    );
    expect(result.current.splitList).toEqual(expectedList);
  });

  it("autoExpenseLinearSplitAdjust recalculates EXACT splits when amount changes", () => {
    const initialSplitList = resetEditOrder([
      makeSplit({ userName: "A", amount: 50 }),
      makeSplit({ userName: "B", amount: 50 }),
    ]);
    const { result } = renderSplitEditor({
      initialSplitList,
      initialSplitType: "EXACT",
      amount: 100,
    });

    act(() => {
      result.current.autoExpenseLinearSplitAdjust("amount", "80");
    });

    const expectedList = recalcSplitsWithEditOrder(initialSplitList, 80);
    expect(result.current.splitList).toEqual(expectedList);
    expect(result.current.splitListValid).toBe(
      Boolean(
        validateSplitList(expectedList, "EXACT", 80) &&
          validateSplitListWithEditOrder(expectedList, 80)
      )
    );
  });

  it("autoExpenseLinearSplitAdjust applies ranged per-day amount when editing a ranged split", () => {
    const initialSplitList = resetEditOrder([
      makeSplit({ userName: "A", amount: 50, editOrder: 0 }),
      makeSplit({ userName: "B", amount: 50, editOrder: 1 }),
    ]);
    const amount = 150;
    const rangedDayCount = 3;
    const perDay = divideAmountForRangedSplit(amount, rangedDayCount);
    const { result } = renderSplitEditor({
      initialSplitList,
      initialSplitType: "EXACT",
      amount,
      duplOrSplit: 2,
      isEditing: true,
      rangedDayCount,
    });

    act(() => {
      result.current.autoExpenseLinearSplitAdjust("amount", String(perDay));
    });

    const expectedList = recalcSplitsWithEditOrder(initialSplitList, perDay);
    expect(result.current.splitList).toEqual(expectedList);
    expect(result.current.splitListValid).toBe(
      Boolean(
        validateSplitList(expectedList, "EXACT", perDay) &&
          validateSplitListWithEditOrder(expectedList, perDay)
      )
    );
  });

  it("splitHandler recalculates splits and fires light impact haptics", () => {
    const { result } = renderSplitEditor({
      initialSplitList: [],
      initialSplitType: "SELF",
      initialSplitTravellersList: ["A", "B"],
      amount: 100,
      whoPaid: "Payer",
    });

    act(() => {
      result.current.splitHandler("EQUAL");
    });

    expect(result.current.splitList).toEqual([
      makeSplit({ userName: "A", amount: 50 }),
      makeSplit({ userName: "B", amount: 50 }),
    ]);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light
    );
  });
});
