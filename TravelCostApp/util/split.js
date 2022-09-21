import { getAllExpenses } from "./http";

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
    { label: "Paid for self", value: "SELF" },
    { label: "Shared equally [=] between ... ", value: "EQUAL" },
    // TODO: make this work next
    // { label: "Shared percents [%] between ...", value: "PERCENT" },
    { label: "Shared exact [$] between ...", value: "EXACT" },
  ];
}

export function travellerToDropdown(travellers) {
  const listOfLabelValues = [];
  travellers.forEach((traveller) => {
    // TODO: make value uid based and not name based
    listOfLabelValues.push({ label: traveller, value: traveller });
  });
  const response = listOfLabelValues;
  return response;
}

export async function calcOpenSplitsTable(tripid) {
  const expenses = await getAllExpenses(tripid);
  const openSplits = [];
  expenses.forEach((expense) => {
    if (!expense.splitList || expense.splitList.length < 1) return;
    expense.splitList.forEach((split) => {
      if (split.userName !== expense.whoPaid) {
        split.whoPaid = expense.whoPaid;
        openSplits.push(split);
      }
    });
  });
  console.log("calcOpenSplitsTable ~ openSplits", openSplits);
}
