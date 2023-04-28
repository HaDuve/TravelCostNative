//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
import { Expense, Split, ExpenseData } from "./expense";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { getAllExpenses } from "./http";

export function recalcSplitsForExact(splitList: Split[], amount: number) {
  console.log("recalcSplitsForExact ~ splitList:", splitList);
  // number of travellers
  const numberOfTravellers = splitList.length;
  // normal split amount
  const splitAmountNorm = amount / numberOfTravellers;
  // splitrest can be 0, negative or positive
  const splitRest =
    amount -
    splitList.reduce((sum, split) => {
      return sum + Number(split.amount);
    }, 0);
  console.log("calcExactSplits ~ splitRest:", splitRest);

  let numberOfTravellersWithoutSplit = 0;
  // count number of travellers without split
  splitList.forEach((split) => {
    if (!split.amount) {
      numberOfTravellersWithoutSplit++;
    }
  });

  // TODO: change this from find one split to a list of travellers who share the rest
  // if there are no travellers without split, find any split with amount equal to splitAmountNorm and adjust that so the rest becomes 0
  if (numberOfTravellersWithoutSplit === 0) {
    const foundNorm = splitList.find((split) => {
      if (sameNumber(Number(split.amount), Number(splitAmountNorm))) {
        split.amount = Number(Number(split.amount) + splitRest).toFixed(2);
        return split;
      }
    });
    // TODO: change this from find one split to a list of travellers who share the rest
    // if not found, adjust the first split with last 2 chars "00" so the rest becomes 0
    if (!foundNorm) {
      const found00 = splitList.find((split) => {
        if (split.amount.slice(-2) === "00") {
          split.amount = Number(Number(split.amount) + splitRest).toFixed(2);
          return split;
        }
      });
      if (!found00) {
        splitList[0].amount = Number(
          Number(splitList[0].amount) + splitRest
        ).toFixed(2);
      }
    }

    for (let i = 0; i < splitList.length; i++) {
      const split = splitList[i];
      split.amount = Number(split.amount).toFixed(2);
    }
    return splitList;
  }

  // return a list of splits with the correct amount for unknown amounts
  const exactSplitList = [];
  splitList.forEach((split) => {
    if (!split.amount) {
      const splitAmount = splitRest / numberOfTravellersWithoutSplit;
      exactSplitList.push({
        userName: split.userName,
        amount: Number(splitAmount).toFixed(2),
      });
    } else {
      exactSplitList.push({
        userName: split.userName,
        amount: Number(split.amount).toFixed(2),
      });
    }
  });
  for (let i = 0; i < exactSplitList.length; i++) {
    const split = exactSplitList[i];
    split.amount = Number(split.amount).toFixed(2);
  }
  return exactSplitList;
}

export function calcSplitList(
  splitType: string,
  amount: number,
  whoPaid: string,
  splitTravellers: string[]
) {
  if (
    !splitType ||
    !amount ||
    Number.isNaN(Number(amount)) ||
    !whoPaid ||
    !splitTravellers ||
    splitTravellers.length < 1
  ) {
    console.log("splitTravellers.length:", splitTravellers.length);
    console.log("splitTravellers:", splitTravellers);
    console.log("whoPaid:", whoPaid);
    console.log("splitType:", splitType);
    console.log("amount:", amount);
    console.warn("calcSplitlist failed");
    return;
  }

  const splitList = [];
  switch (splitType) {
    case "SELF":
      return splitList;
    case "EQUAL": {
      const splitAmount = amount / splitTravellers.length;
      splitTravellers.forEach((traveller) => {
        splitList.push({
          userName: traveller,
          amount: splitAmount.toFixed(2),
        });
      });
      return splitList;
    }
    case "EXACT":
      if (!splitList || splitList.length < 1) {
        const splitAmount = amount / splitTravellers.length;
        splitTravellers.forEach((traveller) => {
          splitList.push({
            userName: traveller,
            amount: splitAmount.toFixed(2),
          });
        });
        return splitList;
      }

      break;
    case "PERCENT":
      {
        if (!splitList || splitList.length < 1) {
          const splitAmount = 100 / splitTravellers.length;
          splitTravellers.forEach((traveller) => {
            splitList.push({
              userName: traveller,
              amount: splitAmount.toFixed(2),
            });
          });
          return splitList;
        }
      }
      break;
    default:
      console.log("[SplitExpense] Wrong splitType :", splitType);
      return [];
  }
}

export function validateSplitList(
  splitList: Split[],
  splitType: string,
  amount: number
) {
  if (!splitList || !splitType || !amount || splitList.length < 1) return;
  switch (splitType) {
    case "SELF":
      break;
    case "EQUAL":
      break;
    case "EXACT": {
      // check if any split.amount are empty, NaN or negative
      for (let i = 0; i < splitList.length; i++) {
        const split = splitList[i];
        const splitAmount = Number(split.amount);
        if (!splitAmount || splitAmount < 0 || Number.isNaN(splitAmount)) {
          return false;
        }
      }
      const splitSum = splitList.reduce((sum: number, split: Split) => {
        return sum + Number(split.amount);
      }, 0);
      return sameNumber(splitSum, Number(amount));
    }
    case "PERCENT":
      break;

    default:
      break;
  }
  return true;
}

export function splitTypesDropdown() {
  // NOTE: optional styling possible
  // containerStyle: 'containerStyle',
  // labelStyle: 'labelStyle'
  return [
    { label: i18n.t("paidSelf"), value: "SELF" },
    { label: i18n.t("sharedEq"), value: "EQUAL" },
    // TODO: make this work next
    // { label: "Shared percents [%] between ...", value: "PERCENT" },
    { label: i18n.t("sharedEx"), value: "EXACT" },
  ];
}

export function travellerToDropdown(travellers) {
  if (!travellers || travellers?.length < 1) {
    console.log("travellertodropdown failed");
    return [];
  }
  const listOfLabelValues = [];
  // sometimes this is not an array but an object
  try {
    travellers.forEach((traveller) => {
      // TODO: make value uid based and not name based
      listOfLabelValues.push({ label: traveller, value: traveller });
    });
  } catch (error) {
    console.log("travellers is an object");
    Object.keys(travellers).forEach((traveller) => {
      // TODO: make value uid based and not name based
      listOfLabelValues.push({ label: traveller, value: traveller });
    });
  }
  return listOfLabelValues;
}

export async function calcOpenSplitsTable(
  tripid: string,
  tripCurrency: string,
  givenExpenses?: Expense[]
) {
  console.log("calcOpenSplitsTable:", calcOpenSplitsTable);
  // cleanup all expenses where payer === debtor
  let expenses = [];
  const rates = {};
  rates[tripCurrency] = 1;
  if (givenExpenses && givenExpenses.length > 0) {
    expenses = JSON.parse(JSON.stringify(givenExpenses));
  } else {
    try {
      expenses = await getAllExpenses(tripid);
    } catch (error) {
      console.log(error);
    }
    if (!expenses || expenses.length < 1) {
      console.log("no expenses!");
      return;
    }
  }
  console.log(expenses.length, "expenses");
  console.log(expenses[0]);
  let openSplits = [];
  const asyncSplitList = async () => {
    for (const exp of expenses) {
      const expense: ExpenseData = exp;
      if (expense.splitType === "SELF" || !expense.splitList) continue;
      console.log("rates:", rates);
      for (const split of expense.splitList) {
        if (split.userName !== expense.whoPaid) {
          // check if rate is already in rates
          if (!rates[expense.currency]) {
            // get rate
            try {
              const rate = expense.amount / expense.calcAmount;
              console.log("asyncSplitList ~ rate:", rate);
              rates[expense.currency] = rate;
              console.log(
                "asyncSplitList ~ expense.currency:",
                expense.currency
              );
              split.amount = split.amount / rate;
              console.log("asyncSplitList ~ split.amount:", split.amount);
            } catch (error) {
              console.error(error);
            }
          } else {
            split.amount = split.amount / rates[expense.currency];
            console.log(
              "asyncSplitList ~ rates[expense.currency]:",
              rates[expense.currency]
            );
            console.log("asyncSplitList ~ split.amount:", split.amount);
          }
          split.whoPaid = expense.whoPaid;
          openSplits.push(split);
        }
      }
    }
  };
  await asyncSplitList();
  console.log(openSplits.length, "openSplits");
  if (openSplits.length < 1) {
    return openSplits;
  }
  openSplits = sumUpSamePairs(openSplits);
  openSplits = cancelDifferences(openSplits);

  return openSplits;
}

export function simplifySplits(openSplits: Split[]) {
  const Splitwise = require("splitwise-js-map");
  const tempSplits = JSON.parse(JSON.stringify(openSplits));
  const listOfSplits = [];
  tempSplits.forEach((openSplit) => {
    if (listOfSplits.some((e) => e.paidBy === openSplit.whoPaid)) {
      /* list contains the element we're looking for */
      const index = listOfSplits.findIndex((e) => {
        return e.paidBy === openSplit.whoPaid;
      });
      if (index !== -1) {
        listOfSplits[index].paidFor[openSplit.userName] = Number(
          openSplit.amount
        );
      }
    } else {
      const newSplit = {
        paidBy: openSplit.whoPaid,
        paidFor: {},
      };
      newSplit.paidFor[openSplit.userName] = Number(openSplit.amount);
      listOfSplits.push(newSplit);
    }
  });
  const simplifiedItems = [];
  console.log(listOfSplits);
  try {
    const splits = Splitwise(listOfSplits);
    splits.forEach((simpleSplit) => {
      const from = simpleSplit[0];
      const to = simpleSplit[1];
      const value = simpleSplit[2];
      const item = {
        amount: Number(value).toFixed(2),
        userName: from,
        whoPaid: to,
      };
      simplifiedItems.push(item);
    });
  } catch (error) {
    console.log("error in simplifying splits", error);
    const item = {
      amount: 0,
      userName: error.message,
      whoPaid: "Error",
    };
    simplifiedItems.push(item);
  }
  return simplifiedItems;
}

function sumUpSamePairs(openSplits) {
  console.log("sumUpSamePairs ~ sumUpSamePairs:", sumUpSamePairs);
  // add up all the sums of the same payer and debtor pair

  if (!openSplits || openSplits.length < 1) return;
  const listOfSums = [];
  openSplits.forEach((split) => {
    if (
      listOfSums.some(
        (e) => e.userName === split.userName && e.whoPaid === split.whoPaid
      )
    ) {
      /* list contains the element we're looking for */
      const index = listOfSums.findIndex((e) => {
        return e.userName === split.userName && e.whoPaid === split.whoPaid;
      });
      if (index !== -1) {
        listOfSums[index].amount += Number(split.amount);
      }
    } else {
      const obj = {
        userName: split.userName,
        whoPaid: split.whoPaid,
        amount: Number(split.amount),
      };
      listOfSums.push(obj);
    }
  });
  return listOfSums;
}

function cancelDifferences(openSplits) {
  let listOfSums = [...openSplits];
  listOfSums.forEach((split) => {
    /* list contains the element we're looking for */
    const index = listOfSums.findIndex((e) => {
      return e.userName === split.whoPaid && e.whoPaid === split.userName;
    });
    if (index !== -1) {
      // same amount
      if (split.amount === listOfSums[index].amount) {
        split.amount = 0;
        listOfSums.splice(index, 1);
      }
      // difference
      if (split.amount > listOfSums[index].amount) {
        split.amount -= listOfSums[index].amount;
        split.amount = split.amount.toFixed(2);
        listOfSums.splice(index, 1);
      }
    }
    listOfSums = listOfSums.filter((item) => item.amount !== 0);
  });

  return listOfSums;
}

export function sameNumber(a: number, b: number, minDiff = 0.02) {
  return Math.abs(a - b) < minDiff;
}
