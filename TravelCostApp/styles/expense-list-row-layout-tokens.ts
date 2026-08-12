import type { LayoutProfile } from "../util/layout";
import { constantScale, dynamicScale } from "../util/scalingUtil";

export type ExpenseListRowLayoutVariant = "ledger" | "templatePicker";

function templatePickerRowShell(layout: LayoutProfile) {
  return {
    alignItems: "flex-start" as const,
    paddingVertical:
      layout.breakpoint === "narrow"
        ? dynamicScale(10, true)
        : layout.space(2),
    width: "100%" as const,
    minHeight: constantScale(72, 0.5),
    height: undefined as number | undefined,
    justifyContent: "flex-start" as const,
  };
}

function groupedLedgerRowShell(layout: LayoutProfile) {
  return {
    justifyContent: "flex-start" as const,
    alignItems: "center" as const,
    minHeight: layout.space(6),
    height: undefined as number | undefined,
    paddingVertical: layout.space(1),
    gap: layout.space(2),
  };
}

function narrowLedgerRowShell() {
  return {
    justifyContent: "space-between" as const,
    minHeight: constantScale(55, 0.5),
    height: constantScale(55, 0.5),
  };
}

function groupedAmountColumn() {
  return {
    flexShrink: 0,
    width: constantScale(150, 0.5),
    minHeight: constantScale(40, 0.5),
    height: constantScale(40, 0.5),
    marginLeft: "auto" as const,
  };
}

function narrowAmountColumn() {
  return {
    flexShrink: 0,
    width: constantScale(150, 0.5),
    minHeight: constantScale(40, 0.5),
    height: constantScale(40, 0.5),
    marginLeft: undefined as "auto" | undefined,
  };
}

export function expenseListRowLayoutTokens(
  layout: LayoutProfile,
  variant: ExpenseListRowLayoutVariant
) {
  if (variant === "templatePicker") {
    return {
      rowShell: templatePickerRowShell(layout),
      amountColumn: {
        flexShrink: 0,
        width: constantScale(108, 0.5),
        minHeight: constantScale(40, 0.5),
        height: undefined as number | undefined,
        marginLeft: undefined as "auto" | undefined,
      },
    };
  }

  if (layout.breakpoint !== "narrow") {
    return {
      rowShell: groupedLedgerRowShell(layout),
      amountColumn: groupedAmountColumn(),
    };
  }

  return {
    rowShell: narrowLedgerRowShell(),
    amountColumn: narrowAmountColumn(),
  };
}

export type ExpenseListRowLayoutTokens = ReturnType<
  typeof expenseListRowLayoutTokens
>;
