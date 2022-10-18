import { getAllExpenses } from "./http";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

export function calcSplitList(
  splitType,
  amount,
  whoPaid,
  splitTravellers,
  splitListInput
) {
  if (
    !splitType ||
    !amount ||
    Number.isNaN(amount) ||
    !whoPaid ||
    !splitTravellers ||
    splitTravellers.length < 1
  ) {
    console.log("calcSplitlist failed");
    return;
  }

  let splitList = [];
  switch (splitType) {
    case "SELF":
      console.log("SELF");
      return splitList;
      break;

    case "EQUAL":
      const splitAmount = amount / splitTravellers.length;
      console.log("splitAmount", splitAmount);
      splitTravellers.forEach((traveller) => {
        splitList.push({
          userName: traveller,
          amount: splitAmount.toFixed(2),
        });
      });
      return splitList;

    case "EXACT":
      console.log("splitListInput EXACT", splitListInput);
      if (!splitList || splitList.length < 1) {
        const splitAmount = amount / splitTravellers.length;
        console.log("splitAmount", splitAmount);
        splitTravellers.forEach((traveller) => {
          splitList.push({
            userName: traveller,
            amount: splitAmount.toFixed(2),
          });
        });
        return splitList;
      }

    case "PERCENT":
      console.log("splitListInput PERCENT", splitListInput);
      if (!splitList || splitList.length < 1) {
        const splitAmount = 100 / splitTravellers.length;
        console.log("splitAmount", splitAmount);
        splitTravellers.forEach((traveller) => {
          splitList.push({
            userName: traveller,
            amount: splitAmount.toFixed(2),
          });
        });
        return splitList;
      }

    default:
      console.log("[SplitExpense] Wrong splitType :", splitType);
      return [];
      break;
  }
}

export function validateSplitList(splitList, splitType, amount, changedIndex) {
  if (!splitList || !splitType || !amount || splitList.length < 1) return;
  switch (splitType) {
    case "SELF":
      break;
    case "EQUAL":
      break;
    case "EXACT":
      const splitSum = splitList.reduce((sum, split) => {
        return sum + Number(split.amount);
      }, 0);
      const minDiff = 0.02;
      const compAmount = Number(amount);
      const HiVal = splitSum < compAmount + minDiff;
      const LoVal = splitSum > compAmount - minDiff;
      return HiVal && LoVal;
      break;
    case "PERCENT":
      break;

    default:
      break;
  }
  return splitList;
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

export async function calcOpenSplitsTable(tripid) {
  // cleanup all expenses where payer === debtor
  let expenses = [];
  try {
    expenses = await getAllExpenses(tripid);
  } catch (error) {
    console.log(error);
  }
  console.log("calcOpenSplitsTable ~ expenses", expenses);
  if (!expenses || expenses.length < 1) return;
  let openSplits = [];
  expenses.forEach((expense) => {
    if (
      !expense.splitList ||
      expense.splitlist === undefined ||
      Object.keys(expense.splitList).length < 1
    )
      return;
    expense.splitList.forEach((split) => {
      if (split.userName !== expense.whoPaid) {
        split.whoPaid = expense.whoPaid;
        openSplits.push(split);
      }
    });
  });
  openSplits = sumUpSamePairs(openSplits);
  openSplits = cancelDifferences(openSplits);
  return openSplits;
}

function sumUpSamePairs(openSplits) {
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
      let obj = {
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
