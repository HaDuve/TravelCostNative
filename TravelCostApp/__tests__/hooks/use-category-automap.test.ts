import { act, renderHook } from "@testing-library/react-native";

import { useCategoryAutomap } from "../../hooks/useCategoryAutomap";
import { makeExpense } from "../fixtures/expense";

describe("useCategoryAutomap", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces description automap and applies category via callback", () => {
    const onApplyCategory = jest.fn();
    const mapDescription = jest.fn(() => "food");
    const getIconForCategory = jest.fn(() => "food-icon");

    const { result } = renderHook(() =>
      useCategoryAutomap({
        pickedCat: "undefined",
        categories: [],
        recentExpenses: [makeExpense({ description: "coffee", category: "food" })],
        onApplyCategory,
        mapDescription,
        getIconForCategory,
      })
    );

    act(() => {
      result.current.debouncedAutoCategory("description", "coffee shop");
    });

    expect(mapDescription).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mapDescription).toHaveBeenCalledWith(
      "coffee shop",
      [],
      expect.any(Array)
    );
    expect(onApplyCategory).toHaveBeenCalled();
    expect(getIconForCategory).toHaveBeenCalledWith("food");
    expect(result.current.icon).toBe("food-icon");
  });

  it("updateCategoryAndIcon applies category fields and icon immediately", () => {
    const onApplyCategory = jest.fn();
    const getIconForCategory = jest.fn(() => "transport-icon");

    const { result } = renderHook(() =>
      useCategoryAutomap({
        pickedCat: "undefined",
        categories: [],
        recentExpenses: [],
        onApplyCategory,
        getIconForCategory,
      })
    );

    act(() => {
      result.current.updateCategoryAndIcon("transport", {
        description: "",
        category: "undefined",
      });
    });

    expect(onApplyCategory).toHaveBeenCalledWith(
      expect.objectContaining({ category: "transport" })
    );
    expect(result.current.icon).toBe("transport-icon");
  });
});
