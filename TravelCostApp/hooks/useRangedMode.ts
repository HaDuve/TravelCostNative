import { useCallback, useState } from "react";

import { DuplicateOption } from "../util/expense";

/**
 * Ranged duplicate/split mode for the expense form.
 * Owns mode transitions, derived alreadyDivided, and collapse amount rules.
 * The duplicate/split Alert UI lives in ExpenseForm; per-day split recalc uses
 * distributeRangedAmount in useSplitEditor, fed by this hook's outputs.
 */
import {
  resolveAlreadyDividedAmountByDays,
  resolveAmountWhenCollapsingRangeToSingleDay,
} from "../util/expense-form-range";

export type RangedMode = "none" | "duplicate" | "split";

export function rangedModeToDuplOrSplit(mode: RangedMode): DuplicateOption {
  if (mode === "duplicate") return DuplicateOption.duplicate;
  if (mode === "split") return DuplicateOption.split;
  return DuplicateOption.null;
}

export function duplOrSplitToRangedMode(
  duplOrSplit: DuplicateOption | number | undefined
): RangedMode {
  const n = Number(duplOrSplit ?? DuplicateOption.null);
  if (n === DuplicateOption.duplicate) return "duplicate";
  if (n === DuplicateOption.split) return "split";
  return "none";
}

export type UseRangedModeParams = {
  isEditing: boolean;
  initialDuplOrSplit?: DuplicateOption | number;
};

export function useRangedMode({
  isEditing,
  initialDuplOrSplit = DuplicateOption.null,
}: UseRangedModeParams) {
  const [mode, setMode] = useState<RangedMode>(() =>
    duplOrSplitToRangedMode(initialDuplOrSplit)
  );
  const [pendingFreshSplitDivision, setPendingFreshSplitDivision] =
    useState(false);
  const [shouldPromptForMode, setShouldPromptForMode] = useState(false);

  const duplOrSplit = rangedModeToDuplOrSplit(mode);
  const alreadyDividedAmountByDays = resolveAlreadyDividedAmountByDays(
    isEditing,
    duplOrSplit,
    pendingFreshSplitDivision
  );

  const clearMode = useCallback(() => {
    setMode("none");
    setPendingFreshSplitDivision(false);
    setShouldPromptForMode(false);
  }, []);

  const setModeFromDuplOrSplit = useCallback(
    (value: DuplicateOption | number | undefined) => {
      setMode(duplOrSplitToRangedMode(value));
      setPendingFreshSplitDivision(false);
      setShouldPromptForMode(false);
    },
    []
  );

  const onMultiDayRangeConfirmed = useCallback(() => {
    if (mode === "none") {
      setShouldPromptForMode(true);
    }
  }, [mode]);

  const consumeModePrompt = useCallback(() => {
    setShouldPromptForMode(false);
  }, []);

  const confirmDuplicate = useCallback(() => {
    setMode("duplicate");
    setPendingFreshSplitDivision(false);
    setShouldPromptForMode(false);
  }, []);

  const confirmSplit = useCallback(() => {
    if (mode !== "split") {
      setPendingFreshSplitDivision(true);
    }
    setMode("split");
    setShouldPromptForMode(false);
  }, [mode]);

  const resolveCollapseToSingleDayAmount = useCallback(
    (input: { amount: number; inclusiveDayCount: number }) =>
      resolveAmountWhenCollapsingRangeToSingleDay({
        amount: input.amount,
        inclusiveDayCount: input.inclusiveDayCount,
        duplOrSplit,
        alreadyDividedAmountByDays,
      }),
    [alreadyDividedAmountByDays, duplOrSplit]
  );

  return {
    mode,
    duplOrSplit,
    alreadyDividedAmountByDays,
    shouldPromptForMode,
    onMultiDayRangeConfirmed,
    consumeModePrompt,
    confirmDuplicate,
    confirmSplit,
    clearMode,
    setModeFromDuplOrSplit,
    resolveCollapseToSingleDayAmount,
  };
}
