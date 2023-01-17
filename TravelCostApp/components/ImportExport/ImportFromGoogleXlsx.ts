import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { storeExpense } from "../../util/http";

export const OpenGoogleXlsxPicker = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    console.log("openFilePicker ~ ", res.name);
    const fileData = await FileSystem.readAsStringAsync(res.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }).then((b64) => XLSX.read(b64, { type: "base64" }));
    return fileData;
  } catch (err) {
    console.error(err);
  }
};

export const importGoogleExcelFile = async (
  uid,
  tripid,
  userName,
  addExpense
) => {
  const workbook = await OpenGoogleXlsxPicker();
  await getGoogleExcelData(workbook, uid, tripid, userName, addExpense);
};

const getGoogleExcelData = async (
  workbook,
  uid,
  tripid,
  userName,
  addExpense
) => {
  // Get the names of all the tables in the workbook
  const sheetNames = workbook.SheetNames;
  // console.log("}).then ~ sheetNames", sheetNames);

  const listOfMonths = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
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
      await importCostDataFromGSXlsx(data, uid, tripid, userName, addExpense);
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
          date: new Date(Date.UTC(0, 0, dateObj.v - 1)),
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
      const data = XLSX.utils.encode_cell(cell_address);
      dataRange.push(sheet[data]);
    }
  }
  return dataRange;
};

async function importCostDataFromGSXlsx(
  data,
  uid,
  tripid,
  userName,
  addExpense
) {
  async function storeImportedExpense(expenseData) {
    await storeExpense(tripid, uid, expenseData);
    // addExpense()
  }

  for (let i = 0; i < data.length; i++) {
    const expenseObj = data[i];
    if (i == 0) console.log("expenseObj", expenseObj);
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
      whoPaid: expenseObj.whoPaid,
      owePerc: expenseObj.percentage,
      splitType: expenseObj.percentage == 0 ? "SELF" : "SELF", // TODO: find out sharing
      listEQUAL: [userName],
      splitList: [],
    };
    await storeImportedExpense(expenseData);
  }
  return;
}
