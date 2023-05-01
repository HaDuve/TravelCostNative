import * as XLSX from "xlsx";
import { storeExpense } from "../../util/http";
import * as Updates from "expo-updates";
import { OpenXLSXPicker } from "./OpenXLSXPicker";
import { reloadApp } from "../../util/appState";

export const importGoogleExcelFileFROM = async (
  uid,
  tripid,
  userName,
  addExpense,
  fromDate
) => {
  const workbook = await OpenXLSXPicker();
  await getGoogleExcelData(
    workbook,
    uid,
    tripid,
    userName,
    addExpense,
    fromDate
  );
  await reloadApp();
};

export const importGoogleExcelFile = async (
  uid,
  tripid,
  userName,
  addExpense
) => {
  const workbook = await OpenXLSXPicker();
  await getGoogleExcelData(workbook, uid, tripid, userName, addExpense);
  await reloadApp();
};

const getGoogleExcelData = async (
  workbook,
  uid,
  tripid,
  userName,
  addExpense,
  fromDate = null
) => {
  // Get the names of all the tables in the workbook
  // const sheetNames = workbook.SheetNames;
  // console.log("}).then ~ sheetNames", sheetNames);

  // const listOfMonths = [
  //   "Januar",
  //   "Februar",
  //   "März",
  //   "April",
  //   "Mai",
  //   "Juni",
  //   "Juli",
  //   "August",
  //   "September",
  //   "Oktober",
  //   "November",
  //   "Dezember",
  // ];
  const listOfMonthsInt = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  // 5 is january

  const config = [
    { cat: "national-travel", start: 22, end: 64 },
    { cat: "accomodation", start: 72, end: 110 },
    { cat: "food", start: 118, end: 253 },
    { cat: "other", start: 261, end: 302 },
  ];
  //TODO: iterate throu months and cats
  for (let i = 0; i < listOfMonthsInt.length; i++) {
    for (let j = 0; j < config.length; j++) {
      // console.log("Monat: ", listOfMonths[i], "Kategorie:", config[j].cat);
      const monthInt = listOfMonthsInt[i];
      const sheet = workbook.Sheets[workbook.SheetNames[monthInt]];
      const catConfig = config[j];
      const data = await getDataObjects(
        sheet,
        catConfig.start,
        catConfig.end,
        catConfig.cat
      );
      await importCostDataFromGSXlsx(
        data,
        uid,
        tripid,
        userName,
        addExpense,
        fromDate
      );
    }
  }
};

async function getDataObjects(sheet, start: number, end: number, cat: string) {
  const textColumnInt = 3;
  const costColumnInt = 4;
  // for food and other we use column B(1), otherwise column D(3)
  const foodTextColumn = 1;
  const otherTextColumn = 1;
  const finalTextColumnInt =
    cat === "food"
      ? foodTextColumn
      : cat === "other"
      ? otherTextColumn
      : textColumnInt;

  const whoPaidColumnInt = 5;
  const percentageColumnInt = 6;

  const dateColumn = await rowsColumsToData(sheet, 0, start - 1, 0, end - 1);
  const textColumn = await rowsColumsToData(
    sheet,
    finalTextColumnInt,
    start - 1,
    finalTextColumnInt,
    end - 1
  );
  const costColumn = await rowsColumsToData(
    sheet,
    costColumnInt,
    start - 1,
    costColumnInt,
    end - 1
  );
  const whoPaidColumn = await rowsColumsToData(
    sheet,
    whoPaidColumnInt,
    start - 1,
    whoPaidColumnInt,
    end - 1
  );
  const percentageColumn = await rowsColumsToData(
    sheet,
    percentageColumnInt,
    start - 1,
    percentageColumnInt,
    end - 1
  );
  const textCostPairs = [];

  for (let i = 0; i < costColumn.length; i++) {
    const dateObj = dateColumn[i];
    const textObj = textColumn[i];
    const costObj = costColumn[i];
    const whoPaidObj = whoPaidColumn[i];
    const percentageObj = percentageColumn[i];

    try {
      if (
        !costObj ||
        !textObj ||
        !whoPaidObj ||
        !percentageObj ||
        isNaN(costObj.v) ||
        costObj.v === 0
      ) {
        continue;
      }
      textCostPairs.push({
        cat: cat,
        text: textObj.w,
        cost: costObj.v,
        date: new Date(Date.UTC(0, 0, dateObj.v - 1)),
        whoPaid: whoPaidObj.w,
        percentage: percentageObj.v,
      });

      // debug
      if (i == 0) {
        textCostPairs.push({
          cat: cat,
          text: textObj.w,
          cost: costObj.v,
          date: new Date(Date.UTC(0, 0, dateObj.v + 1)),
          whoPaid: whoPaidObj.w,
          percentage: percentageObj.v,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
  return textCostPairs;
}

const rowsColumsToData = async (
  sheet,
  startColumn: number,
  startRow: number,
  endColumn: number,
  endRow: number
) => {
  const range = {
    s: { c: startColumn, r: startRow },
    e: { c: endColumn, r: endRow },
  };
  const dataRange = [];
  /* Iterate through each element in the structure */
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const dataAddress = XLSX.utils.encode_cell(cell_address);
      dataRange.push(sheet[dataAddress]);
    }
  }
  return dataRange;
};

async function importCostDataFromGSXlsx(
  data,
  uid,
  tripid,
  userName,
  addExpense,
  fromDate = null
) {
  async function storeImportedExpense(expenseData) {
    await storeExpense(tripid, uid, expenseData);
    // addExpense()
  }

  /**
  returns a list of length 2

   [0] is Hannes split cost

   [1] is Tina split cost
   */
  function calculateSplitCost(
    whopaid: string,
    percentage: number,
    amount: number
  ) {
    // whopaid is H or T
    // percentage is 0-100
    // amount is a number
    const splitCostList = [];
    if (whopaid == "H") {
      splitCostList.push(((100 - percentage) / 100) * amount);
      splitCostList.push((percentage / 100) * amount);
    } else if (whopaid == "T") {
      splitCostList.push((percentage / 100) * amount);
      splitCostList.push(((100 - percentage) / 100) * amount);
    } else {
      console.warn("Invalid whopaid");
    }
    return splitCostList;
  }

  for (let i = 0; i < data.length; i++) {
    const expenseObj = data[i];
    // if (i == 0) console.log("expenseObj", expenseObj);

    const splitString = calculateSplitCost(
      expenseObj.whoPaid,
      expenseObj.percentage,
      expenseObj.cost
    );
    const expenseData = {
      uid: uid,
      amount: +expenseObj.cost,
      calcAmount: +expenseObj.cost,
      date: expenseObj.date,
      endDate: expenseObj.date,
      description: expenseObj.text,
      category: expenseObj.cat,
      country: "",
      currency: "EUR",
      // hardcoded for now
      whoPaid:
        expenseObj.whoPaid == "H"
          ? "Hannes"
          : expenseObj.whoPaid == "T"
          ? "Tina"
          : expenseObj.whoPaid,
      // owePerc is outdated
      owePerc: 0,
      splitType: "EXACT",
      // hardcoded for now
      listEQUAL: ["Hannes", "Tina"],
      splitList: [
        { amount: splitString[0], userName: "Hannes" },
        { amount: splitString[1], userName: "Tina" },
      ],
    };
    const performTimeConsumingTask = async () => {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve("result");
        }, 10)
      );
    };
    if (fromDate != null && new Date(fromDate) > new Date(expenseData.date)) {
      continue; // too old
    }
    console.log("expense not too old: " + expenseData.date, fromDate);
    await storeImportedExpense(expenseData);
  }
  return;
}
