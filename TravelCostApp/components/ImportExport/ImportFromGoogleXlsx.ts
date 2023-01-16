import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";

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
  console.log("}).then ~ sheetNames", sheetNames);

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
      const monthInt = listOfMonthsInt[i];
      const sheet = workbook.Sheets[workbook.SheetNames[monthInt]];
      const catConfig = config[j];
      const data = await getDataObjects(
        sheet,
        catConfig.start,
        catConfig.end,
        catConfig.cat
      );
      // TODO: add WerHatBezahlt, Schulden Beglichen, Schulden Prozent into data
      console.log("data", data);
    }
  }
  //   await importExpenseFromXLSX(pairs, uid, tripid, userName, addExpense);
};

async function getDataObjects(sheet, start: number, end: number, cat: string) {
  const dateColumn = await rowsColumsToData(sheet, 0, start - 1, 0, end - 1);
  const textColumn = await rowsColumsToData(sheet, 3, start - 1, 3, end - 1);
  const costColumn = await rowsColumsToData(sheet, 4, start - 1, 4, end - 1);
  const textCostPairs = [];

  for (let i = 0; i < costColumn.length; i++) {
    const dateObj = dateColumn[i];
    const textObj = textColumn[i];
    const costObj = costColumn[i];
    try {
      if (!costObj || !textObj || isNaN(costObj.v) || costObj.v === 0) {
        continue;
      }
      textCostPairs.push({
        date: new Date(Date.UTC(0, 0, dateObj.v - 1)),
        text: textObj.w,
        cost: costObj.v,
        cat: cat,
      });
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
