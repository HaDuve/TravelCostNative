import { i18n } from "../i18n/i18n";
import { DateTime } from "luxon";
import {
  Split,
  ExpenseData,
  isPaidString,
  getEffectiveIsPaid,
} from "./expense";
import { Traveller } from "./traveler";
import { DateOrDateTime } from "./date";

import { getAllExpenses } from "./http";
import safeLogError from "./error";
import { safelyParseJSON } from "./jsonParse";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const Splitwise = require("splitwise-js-map");

export function calcSplitList(
  splitType: splitType,
  amount: number,
  whoPaid: string,
  splitTravellers: string[]
): Split[] | undefined {
  if (
    !splitType ||
    !amount ||
    Number.isNaN(Number(amount)) ||
    !whoPaid ||
    !splitTravellers ||
    splitTravellers?.length < 1
  ) {
    return;
  }

  const splitList: Split[] = [];
  switch (splitType) {
    case "SELF":
      return splitList;
    case "EQUAL": {
      const splitAmount = amount / splitTravellers?.length;
      splitTravellers.forEach((traveller) => {
        splitList.push({
          userName: traveller,
          amount: Number(splitAmount.toFixed(2)),
        });
      });
      return splitList;
    }
    case "EXACT":
      if (!splitList || splitList?.length < 1) {
        const splitAmount = amount / splitTravellers?.length;
        splitTravellers.forEach((traveller) => {
          splitList.push({
            userName: traveller,
            amount: Number(splitAmount.toFixed(2)),
          });
        });
        return splitList;
      }

      break;
    case "PERCENT":
      {
        if (!splitList || splitList?.length < 1) {
          const splitAmount = 100 / splitTravellers?.length;
          splitTravellers.forEach((traveller) => {
            splitList.push({
              userName: traveller,
              amount: Number(splitAmount.toFixed(2)),
            });
          });
          return splitList;
        }
      }
      break;
    default:
      return [];
  }
}

/**
 * Recalculates splits using edit-order-based approach.
 * Preserves edited splits and distributes remainder intelligently.
 * @param splitList - Array of splits with optional editOrder
 * @param amount - Total amount to distribute
 * @returns Updated split list with recalculated amounts
 */
export function recalcSplitsWithEditOrder(
  splitList: Split[],
  amount: number
): Split[] {
  if (!splitList || splitList.length === 0 || amount === 0) {
    return splitList;
  }

  // Create a copy to avoid mutating the original
  const updatedList = splitList.map((split) => ({ ...split }));

  // Separate edited and unedited splits
  const editedSplits = updatedList.filter(
    (split) => split.editOrder !== undefined
  );
  const uneditedSplits = updatedList.filter(
    (split) => split.editOrder === undefined
  );

  // Calculate sum of edited splits
  const editedSum = editedSplits.reduce(
    (sum, split) => sum + Number(split.amount),
    0
  );

  // Calculate remainder to distribute
  const remainder = amount - editedSum;

  // If remainder is zero, no changes needed
  if (sameNumber(remainder, 0)) {
    return updatedList;
  }

  // If remainder is negative, edited splits exceed total - this is an error case
  // but we'll still try to distribute by adjusting edited splits (except the most recent)
  if (remainder < 0) {
    // Sort edited splits by editOrder (highest first, but skip editOrder 0)
    const editableSplits = editedSplits
      .filter((split) => split.editOrder !== 0)
      .sort((a, b) => (b.editOrder || 0) - (a.editOrder || 0));

    // Distribute the negative remainder (reduction) among editable splits
    const remainingAdjustment = remainder;
    for (const split of editableSplits) {
      const currentAmount = Number(split.amount);
      const adjustment = remainingAdjustment / editableSplits.length;
      split.amount = Number(
        Number(Math.max(0, currentAmount + adjustment)).toFixed(2)
      );
    }

    // Recalculate remainder after adjustment
    const newEditedSum = updatedList
      .filter((split) => split.editOrder !== undefined)
      .reduce((sum, split) => sum + Number(split.amount), 0);
    const newRemainder = amount - newEditedSum;

    // If still negative, we need to adjust unedited splits too
    if (newRemainder < 0 && uneditedSplits.length > 0) {
      const uneditedAdjustment = newRemainder / uneditedSplits.length;
      uneditedSplits.forEach((split) => {
        const currentAmount = Number(split.amount) || 0;
        split.amount = Number(
          Number(Math.max(0, currentAmount + uneditedAdjustment)).toFixed(2)
        );
      });
    } else if (newRemainder > 0 && uneditedSplits.length > 0) {
      // Distribute positive remainder to unedited splits (replace, not add)
      const uneditedAmount = newRemainder / uneditedSplits.length;
      uneditedSplits.forEach((split) => {
        split.amount = Number(Number(uneditedAmount).toFixed(2));
      });
    }

    return updatedList;
  }

  // Positive remainder: distribute to unedited splits first
  if (uneditedSplits.length > 0) {
    // Replace unedited split amounts with equal distribution of remainder
    const uneditedAmount = remainder / uneditedSplits.length;
    uneditedSplits.forEach((split) => {
      split.amount = Number(Number(uneditedAmount).toFixed(2));
    });
  } else {
    // No unedited splits: distribute to edited splits (oldest first, but preserve editOrder 0)
    const editableSplits = editedSplits
      .filter((split) => split.editOrder !== 0)
      .sort((a, b) => (b.editOrder || 0) - (a.editOrder || 0));

    if (editableSplits.length > 0) {
      const editableAdjustment = remainder / editableSplits.length;
      editableSplits.forEach((split) => {
        const currentAmount = Number(split.amount);
        split.amount = Number(
          Number(currentAmount + editableAdjustment).toFixed(2)
        );
      });
    } else if (editedSplits.length === 1 && editedSplits[0].editOrder === 0) {
      // Only one split and it's the most recent edit - adjust it (edge case)
      const split = editedSplits[0];
      split.amount = Number(Number(amount).toFixed(2));
    }
  }

  return updatedList;
}

/**
 * Validates if split list can be made valid given edit constraints.
 * @param splitList - Array of splits with optional editOrder
 * @param amount - Total amount
 * @returns true if valid, false otherwise
 */
export function validateSplitListWithEditOrder(
  splitList: Split[],
  amount: number
): boolean {
  if (!splitList || splitList.length === 0 || !amount) {
    return false;
  }

  // Check if any split has invalid amount
  for (const split of splitList) {
    const splitAmount = Number(split.amount);
    if (Number.isNaN(splitAmount) || splitAmount < 0) {
      return false;
    }
  }

  // Calculate sum of edited splits (those with editOrder defined)
  const editedSplits = splitList.filter(
    (split) => split.editOrder !== undefined
  );
  const editedSum = editedSplits.reduce(
    (sum, split) => sum + Number(split.amount),
    0
  );

  // If edited splits alone exceed total, it's invalid
  if (editedSum > amount + 0.02) {
    // Allow small floating point differences
    return false;
  }

  // If there are unedited splits, they can accommodate the remainder
  const uneditedSplits = splitList.filter(
    (split) => split.editOrder === undefined
  );
  if (uneditedSplits.length > 0) {
    return true; // Can always distribute to unedited splits
  }

  // All splits are edited - check if they sum correctly
  const totalSum = splitList.reduce(
    (sum, split) => sum + Number(split.amount),
    0
  );
  return sameNumber(totalSum, amount);
}

export function validateSplitList(
  splitList: Split[],
  splitType: splitType,
  amount: number
) {
  if (!splitList || !splitType || !amount || splitList?.length < 1) return;
  switch (splitType) {
    case "SELF":
      break;
    case "EQUAL":
      break;
    case "EXACT": {
      // check if any split.amount are empty, NaN or negative
      for (let i = 0; i < splitList?.length; i++) {
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
export type splitType = "EQUAL" | "SELF" | "EXACT" | "PERCENT";

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

export function travellerToDropdown(
  travellers: string[] | Traveller[] | { [key: string]: { userName: string } },
  includeAddTraveller = true
): Array<{ label: string; value: string }> {
  if (!travellers || (Array.isArray(travellers) && travellers.length < 1)) {
    return [];
  }
  const listOfLabelValues: Array<{ label: string; value: string }> = [];
  // sometimes this is not an array but an object
  try {
    if (Array.isArray(travellers)) {
      travellers.forEach((traveller) => {
        // Handle both string[] and Traveller[]
        const userName =
          typeof traveller === "string" ? traveller : traveller.userName;
        // TODO: make value uid based and not name based
        listOfLabelValues.push({ label: userName, value: userName });
      });
    } else {
      // get travellers.user.username
      Object.keys(travellers).forEach((key) => {
        listOfLabelValues.push({
          label: travellers[key]["userName"],
          value: travellers[key]["userName"],
        });
      });
    }
  } catch (error) {
    // Fallback: try to extract user names from object
    if (!Array.isArray(travellers)) {
      Object.keys(travellers).forEach((key) => {
        const traveller = travellers[key];
        if (
          traveller &&
          typeof traveller === "object" &&
          "userName" in traveller
        ) {
          listOfLabelValues.push({
            label: traveller.userName,
            value: traveller.userName,
          });
        }
      });
    }
  }

  // Add "+ add traveller" item at the end only if requested
  if (includeAddTraveller) {
    listOfLabelValues.push({
      label: `+ ${i18n.t("inviteTraveller")}`,
      value: "__ADD_TRAVELLER__",
    });
  }

  return [...listOfLabelValues];
}

export async function calcOpenSplitsTable(
  tripid: string,
  tripCurrency: string,
  givenExpenses?: ExpenseData[],
  tripIsPaidTimestamp?: number
) {
  // cleanup all expenses where payer === debtor
  let expenses = [];
  const rates = {};
  rates[tripCurrency] = 1;
  if (givenExpenses && givenExpenses?.length > 0) {
    // create a copy
    try {
      expenses = safelyParseJSON(JSON.stringify(givenExpenses));
    } catch (error) {
      safeLogError(error);
    }
  } else {
    try {
      expenses = await getAllExpenses(tripid);
    } catch (error) {
      safeLogError(error);
    }
    if (!expenses || expenses?.length < 1) {
      return;
    }
  }
  let openSplits = [];
  const asyncSplitList = async () => {
    for (const exp of expenses) {
      const expense: ExpenseData = exp;

      // Skip expense if:
      // 1. Expense type is SELF
      // 2. Expense has no split list
      // 3. Expense has effective isPaid status of "paid" (checked via timestamp override logic)
      if (
        expense.splitType === "SELF" ||
        !expense.splitList ||
        getEffectiveIsPaid(expense, tripIsPaidTimestamp) === isPaidString.paid
      ) {
        continue;
      }
      for (const split of expense.splitList) {
        if (split.userName !== expense.whoPaid) {
          // check if rate is already in rates
          if (!rates[expense.currency]) {
            // get rate
            try {
              const rate = expense.amount / expense.calcAmount;
              rates[expense.currency] = rate;
              split.amount = split.amount / rate;
            } catch (error) {
              safeLogError(error);
            }
          } else {
            split.amount = split.amount / rates[expense.currency];
          }
          split.whoPaid = expense.whoPaid;
          openSplits.push(split);
        }
      }
    }
  };
  await asyncSplitList();
  if (openSplits?.length < 1) {
    return openSplits;
  }
  openSplits = sumUpSamePairs(openSplits);
  openSplits = cancelDifferences(openSplits);

  return openSplits;
}

export function simplifySplits(openSplits: Split[]) {
  let tempSplits = [];
  try {
    tempSplits = safelyParseJSON(JSON.stringify(openSplits));
  } catch (error) {
    safeLogError(error);
  }
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
    safeLogError(error);
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
  // add up all the sums of the same payer and debtor pair

  if (!openSplits || openSplits?.length < 1) return;
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
        split.amount = Number(split.amount.toFixed(2));
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

export function areSplitListsEqual(list1, list2) {
  // Check if the lengths are the same
  if (list1.length !== list2.length) {
    return false;
  }

  // Iterate through the lists
  for (let i = 0; i < list1.length; i++) {
    const element1 = list1[i];
    const element2 = list2[i];

    // Compare elements (assuming elements are objects)
    if (!areSplitObjectsEqual(element1, element2)) {
      return false;
    }
  }

  // If we reach this point, the lists are equal
  return true;
}

export function areSplitObjectsEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check if the objects have the same number of properties
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Compare each property of the objects
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  // If we reach this point, the objects are equal
  return true;
}
