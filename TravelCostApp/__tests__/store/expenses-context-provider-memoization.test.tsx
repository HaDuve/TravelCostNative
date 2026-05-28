import React, { useContext, useEffect } from "react";
import { render } from "@testing-library/react-native";

import ExpensesContextProvider, {
  ExpensesContext,
} from "../../store/expenses-context";

jest.mock("../../store/mmkv", () => ({
  MMKV_KEYS: {
    EXPENSES: "expenses",
  },
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
}));

function ValueSpy({ onValue }: { onValue: (value: unknown) => void }) {
  const value = useContext(ExpensesContext);

  useEffect(() => {
    onValue(value);
  }, [onValue, value]);

  return null;
}

function TestHarness({
  seed,
  onValue,
}: {
  seed: number;
  onValue: (value: unknown) => void;
}) {
  // `seed` is intentionally unused by the provider; it only forces a re-render.
  return (
    <ExpensesContextProvider>
      <ValueSpy
        onValue={(v) => {
          // ensure we record a value per re-render even when `v` is stable
          seed;
          onValue(v);
        }}
      />
    </ExpensesContextProvider>
  );
}

describe("ExpensesContextProvider memoization", () => {
  it("keeps the provider value object referentially stable across unrelated re-renders", () => {
    const seen: unknown[] = [];
    const onValue = (value: unknown) => {
      seen.push(value);
    };

    const { rerender } = render(<TestHarness seed={1} onValue={onValue} />);
    rerender(<TestHarness seed={2} onValue={onValue} />);

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[0]).toBe(seen[1]);
  });
});

