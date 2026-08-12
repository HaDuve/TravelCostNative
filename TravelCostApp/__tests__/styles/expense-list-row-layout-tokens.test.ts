import { layoutFor } from "../../util/layout";
import {
  expenseListRowLayoutTokens,
} from "../../styles/expense-list-row-layout-tokens";
import { constantScale, dynamicScale } from "../../util/scalingUtil";

describe("expense-list-row-layout-tokens", () => {
  it("does not inflate ledger row height on wide landscape", () => {
    const layout = layoutFor({ width: 1194, height: 834 });
    const tokens = expenseListRowLayoutTokens(layout, "ledger");

    expect(tokens.rowShell.height).toBeUndefined();
    expect(tokens.rowShell.minHeight).toBe(layout.space(6));
    expect(tokens.rowShell.justifyContent).toBe("flex-start");
    expect(tokens.rowShell.gap).toBe(layout.space(2));
  });

  it("keeps phone ledger rows compact with a fixed height", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    const tokens = expenseListRowLayoutTokens(layout, "ledger");

    expect(tokens.rowShell.height).toBe(constantScale(55, 0.5));
    expect(tokens.rowShell.justifyContent).toBe("space-between");
  });

  it("right-aligns the amount column inside grouped wide ledger rows", () => {
    const layout = layoutFor({ width: 1194, height: 834 });
    const tokens = expenseListRowLayoutTokens(layout, "ledger");

    expect(tokens.amountColumn.marginLeft).toBe("auto");
  });

  it("uses flex columns for template picker rows without landscape height hacks", () => {
    const layout = layoutFor({ width: 1194, height: 834 });
    const tokens = expenseListRowLayoutTokens(layout, "templatePicker");

    expect(tokens.rowShell.height).toBeUndefined();
    expect(tokens.rowShell.minHeight).toBe(constantScale(72, 0.5));
    expect(dynamicScale(100, true)).not.toBe(tokens.rowShell.minHeight);
  });
});
