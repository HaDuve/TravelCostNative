import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import { importExpenseFromXLSX } from "./ImportExpense";
import * as Updates from "expo-updates";

export const OpenXLSXPicker = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    console.log(
      "openFilePicker ~ JSON.stringify(res)",
      JSON.stringify(res, null, 4)
    );
    const fileData = await FileSystem.readAsStringAsync(res.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }).then((b64) => XLSX.read(b64, { type: "base64" }));
    return fileData;
  } catch (err) {
    console.error(err);
  }
};

const getExcelData = async (workbook, uid, tripid, userName, addExpense) => {
  // Get the names of all the tables in the workbook
  // const sheetNames = workbook.SheetNames;

  const sheet = workbook.Sheets[workbook.SheetNames[2]];
  const index1 = getAllTextCostPairs(sheet, 1);
  console.log("getExcelData ~ index1", index1);
  await importExpenseFromXLSX(index1, uid, tripid, userName, addExpense);

  const index2 = getAllTextCostPairs(sheet, 2);
  console.log("getExcelData ~ index2", index2);
  await importExpenseFromXLSX(index2, uid, tripid, userName, addExpense);

  const index3 = getAllTextCostPairs(sheet, 3);
  console.log("getExcelData ~ index3", index3);
  await importExpenseFromXLSX(index3, uid, tripid, userName, addExpense);
};

async function getAllTextCostPairs(sheet, index) {
  /**
   * Anreise 2, 12, 2, 17 - 4, 12, 4, 17
   * 13-18 ANREISE
   * 24-29 INLANDSFLUG
   * 35-124 FORTBEWEGUNG
   * 130-158 TOUREN & AKTIVITÄTEN
   * 164-253 UNTERKUNFT
   * 259-348 ESSEN & TRINKEN
   * 353 VISUM
   * 358 SIM KARTE
   * 364-453 VERGNÜGEN
   * 459-468 SONSTIGES 1 (gesamt)
   * 474-483 SONSTIGES 2 (gesamt)
   * 489-498 SONSTIGES 3 (gesamt)
   * 504-593 SONSTIGES 4 (täglich)
   * 599-688 SONSTIGES 5 (täglich)
   */
  let config = [];
  switch (index) {
    case 1:
      config = [
        { cat: "ANREISE", start: 13, end: 18 },
        { cat: "INLANDSFLUG", start: 24, end: 29 },
        { cat: "FORTBEWEGUNG", start: 35, end: 124 },
        { cat: "TOUREN & AKTIVITÄTEN", start: 130, end: 158 },
        { cat: "UNTERKUNFT", start: 164, end: 253 },
      ];
      break;

    case 2:
      config = [
        { cat: "ESSEN & TRINKEN", start: 259, end: 348 }, // Ab hier klappts nicht mehr??
        { cat: "VISUM", start: 353, end: 353 },
        { cat: "SIM KARTE", start: 358, end: 358 },
        { cat: "VERGNÜGEN", start: 364, end: 453 },
      ];
      break;

    case 3:
      config = [
        { cat: "SONSTIGES 1 (gesamt)", start: 459, end: 468 },
        { cat: "SONSTIGES 2 (gesamt)", start: 474, end: 483 },
        { cat: "SONSTIGES 3 (gesamt)", start: 489, end: 498 },
        { cat: "SONSTIGES 4 (täglich)", start: 504, end: 593 },
        { cat: "SONSTIGES 5 (täglich)", start: 599, end: 688 },
      ];
      break;

    default:
      break;
  }

  const listOfCategoriesTextCostPairs = [];

  for (let i = 0; i < config.length; i++) {
    const catRange = config[i];
    if (!(catRange && catRange.start && catRange.end && catRange.cat)) {
      continue;
    }
    listOfCategoriesTextCostPairs.push(
      await getCatTextCostPairs(
        sheet,
        catRange.start,
        catRange.end,
        catRange.cat
      )
    );
  }

  console.log(
    "getAllTextCostPairs ~ listOfCategoriesTextCostPairs",
    listOfCategoriesTextCostPairs
  );

  return listOfCategoriesTextCostPairs;
}

async function getCatTextCostPairs(
  sheet,
  start: number,
  end: number,
  cat: string,
  offset = 0
) {
  const addOffset = offset * 9;
  const textColumn = await rowsColumsToData(
    sheet,
    2 + addOffset,
    start - 1,
    2 + addOffset,
    end - 1
  );
  const costColumn = await rowsColumsToData(
    sheet,
    4 + addOffset,
    start - 1,
    4 + addOffset,
    end - 1
  );
  const textCostPairs = [];

  for (let i = 0; i < costColumn.length; i++) {
    const textObj = textColumn[i];
    const costObj = costColumn[i];
    try {
      if (!costObj || !textObj || isNaN(costObj.v) || costObj.v === 0) continue;
      textCostPairs.push({ text: textObj.v, cost: costObj.v, cat: cat });
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
  var range = {
    s: { c: startColumn, r: startRow },
    e: { c: endColumn, r: endRow },
  };
  var dataRange = [];
  /* Iterate through each element in the structure */
  for (var R = range.s.r; R <= range.e.r; ++R) {
    for (var C = range.s.c; C <= range.e.c; ++C) {
      var cell_address = { c: C, r: R };
      var data = XLSX.utils.encode_cell(cell_address);
      dataRange.push(sheet[data]);
    }
  }
  return dataRange;
};

export const importExcelFile = async (uid, tripid, userName, addExpense) => {
  const workbook = await OpenXLSXPicker();
  await getExcelData(workbook, uid, tripid, userName, addExpense);
  await Updates.reloadAsync();
};
