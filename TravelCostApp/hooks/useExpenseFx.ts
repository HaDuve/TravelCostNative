import { useEffect, useMemo, useState } from "react";

import { getRate } from "../util/currencyExchange";
import type { Split } from "../util/expense";

export type GetRateFn = (
  base: string,
  target: string
) => Promise<number>;

export type UseExpenseFxOptions = {
  tripCurrency: string;
  expenseCurrency: string;
  amountValue: string | number;
  splitList: Split[];
  getRate?: GetRateFn;
};

export function useExpenseFx({
  tripCurrency,
  expenseCurrency,
  amountValue,
  splitList,
  getRate: getRateFn = getRate,
}: UseExpenseFxOptions) {
  const [calcAmount, setCalcAmount] = useState("");
  const [splitListCalcAmounts, setSplitListCalcAmounts] = useState([""]);

  const hasCalcAmount = Boolean(
    amountValue &&
      expenseCurrency &&
      expenseCurrency !== tripCurrency
  );

  useEffect(() => {
    let cancelled = false;

    async function runFxConversion() {
      const rate = await getRateFn(tripCurrency, expenseCurrency);
      if (cancelled) {
        return;
      }

      const convertedAmount = +amountValue / rate;
      const splitConvertedAmounts: string[] = [];

      if (splitList?.length > 0) {
        splitList.forEach((split) => {
          splitConvertedAmounts.push((split.amount / rate).toFixed(2));
        });
      }

      if (!hasCalcAmount || rate === -1 || rate === 1) {
        setCalcAmount("");
        setSplitListCalcAmounts([""]);
        return;
      }

      setSplitListCalcAmounts(splitConvertedAmounts);
      setCalcAmount(convertedAmount.toFixed(2));
    }

    runFxConversion();

    return () => {
      cancelled = true;
    };
  }, [
    amountValue,
    expenseCurrency,
    getRateFn,
    hasCalcAmount,
    splitList,
    tripCurrency,
  ]);

  return useMemo(
    () => ({
      calcAmount,
      splitListCalcAmounts,
      hasCalcAmount,
    }),
    [calcAmount, hasCalcAmount, splitListCalcAmounts]
  );
}
