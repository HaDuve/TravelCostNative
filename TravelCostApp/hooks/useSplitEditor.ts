import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";

import type { Split } from "../util/expense";
import { distributeRangedAmount } from "../util/expense-form-range";
import {
  applySplitEdit,
  calcSplitList,
  recalcSplitsWithEditOrder,
  removeFromSplit,
  resetEditOrder,
  splitType,
  validateSplitList,
  validateSplitListWithEditOrder,
} from "../util/split";
import { VexoEvents } from "../util/vexo-constants";
import { trackEvent } from "../util/vexo-tracking";

const SPLIT_TYPES = {
  EQUAL: "EQUAL",
  EXACT: "EXACT",
  SELF: "SELF",
} as const satisfies Record<string, splitType>;

export type UseSplitEditorOptions = {
  initialSplitList?: Split[];
  initialSplitType?: splitType;
  initialSplitTravellersList?: string[];
  amount: number;
  whoPaid: string | null;
  tripTravellerNames: string[];
  onAutosave?: () => void;
  duplOrSplit?: number;
  isEditing?: boolean;
  rangedDayCount?: number;
  alreadyDividedAmountByDays?: boolean;
};

export function useSplitEditor({
  initialSplitList = [],
  initialSplitType = "SELF",
  initialSplitTravellersList = [],
  amount,
  whoPaid,
  tripTravellerNames,
  onAutosave,
  duplOrSplit = 0,
  isEditing = false,
  rangedDayCount = 1,
  alreadyDividedAmountByDays = false,
}: UseSplitEditorOptions) {
  const [splitList, setSplitList] = useState(() =>
    resetEditOrder(initialSplitList)
  );
  const [splitListValid, setSplitListValid] = useState(true);
  const [currentSplitType, setSplitTypeState] =
    useState<splitType>(initialSplitType);
  const [splitTravellersList, setSplitTravellersList] = useState(
    initialSplitTravellersList
  );

  const inputSplitListHandler = useCallback(
    (index: number, props: { userName: string }, value: string) => {
      if (currentSplitType === SPLIT_TYPES.EQUAL) {
        return;
      }
      const { splitList: nextList, valid } = applySplitEdit(
        splitList,
        index,
        props.userName,
        value,
        amount,
        currentSplitType
      );
      setSplitList(nextList);
      setSplitListValid(valid);
    },
    [amount, currentSplitType, splitList]
  );

  const splitHandler = useCallback(
    (selectedSplitType: splitType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const listSplits = calcSplitList(
        selectedSplitType,
        amount,
        whoPaid ?? "",
        splitTravellersList
      );
      if (listSplits) {
        setSplitList(resetEditOrder(listSplits));
      }
    },
    [amount, splitTravellersList, whoPaid]
  );

  const setSplitType = useCallback(
    (value: splitType) => {
      setSplitTypeState(value);
      trackEvent(VexoEvents.SPLIT_TYPE_SELECTED, { splitType: value });
      onAutosave?.();
    },
    [onAutosave]
  );

  const removeUserFromSplit = useCallback(
    (userName: string) => {
      if (!splitList || splitList.length < 1) {
        return;
      }
      const result = removeFromSplit(
        splitList,
        userName,
        whoPaid ?? "",
        currentSplitType,
        amount,
        tripTravellerNames
      );
      if (!result) {
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.splitType !== currentSplitType) {
        setSplitTypeState(result.splitType);
      }
      setSplitList(result.splitList);
      if (result.valid !== undefined) {
        setSplitListValid(result.valid);
      }
    },
    [amount, currentSplitType, splitList, tripTravellerNames, whoPaid]
  );

  const autoExpenseLinearSplitAdjust = useCallback(
    (inputIdentifier: string, value: string) => {
      if (
        inputIdentifier !== "amount" ||
        (currentSplitType !== SPLIT_TYPES.EXACT &&
          currentSplitType !== SPLIT_TYPES.EQUAL)
      ) {
        return;
      }
      if (duplOrSplit === 2 && isEditing) {
        const rangedList = recalcSplitsWithEditOrder(
          splitList,
          distributeRangedAmount({
            total: amount,
            dayCount: rangedDayCount,
            mode: duplOrSplit,
            alreadyDivided: alreadyDividedAmountByDays,
          })
        );
        setSplitList(rangedList);
        setSplitListValid(
          Boolean(
            validateSplitList(rangedList, currentSplitType, amount) &&
              validateSplitListWithEditOrder(rangedList, amount)
          )
        );
      }
      const numericValue = +value;
      const nextList = recalcSplitsWithEditOrder(splitList, numericValue);
      setSplitList(nextList);
      setSplitListValid(
        Boolean(
          validateSplitList(nextList, currentSplitType, numericValue) &&
            validateSplitListWithEditOrder(nextList, numericValue)
        )
      );
    },
    [
      amount,
      currentSplitType,
      alreadyDividedAmountByDays,
      duplOrSplit,
      isEditing,
      rangedDayCount,
      splitList,
    ]
  );

  return {
    splitList,
    setSplitList,
    splitType: currentSplitType,
    splitListValid,
    setSplitListValid,
    splitTravellersList,
    setSplitTravellersList,
    inputSplitListHandler,
    removeUserFromSplit,
    splitHandler,
    autoExpenseLinearSplitAdjust,
    setSplitType,
  };
}
