import { OpenXLSXPicker } from "./OpenXLSXPicker";
import * as XLSX from "xlsx";

export async function exportAllExpensesToXLSX(expenses) {
  //assume only one year

  const workbook = await OpenXLSXPicker();
  // 5 is january
  const listOfMonthsInt = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const config = [
    { cat: "national-travel", start: 22, end: 64 },
    { cat: "accomodation", start: 72, end: 110 },
    { cat: "food", start: 118, end: 253 },
    { cat: "other", start: 261, end: 302 },
  ];
  // console.log(
  //   "exportAllExpensesToXLSX ~ workbook.SheetNames",
  //   workbook.SheetNames
  // );
  const sheet = workbook.SheetNames[6];
  const ws = workbook.Sheets[sheet];

  /* Write data starting at A2 */
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      ["1", "von", "nach", "beschreibungstext", 10, "H", 50, "N"],
      [2, "von", "nach", "beschreibungstext", 20, "T", 20, "N"],
      [3, "von", "nach", "beschreibungstext", 30, "T", 100, "N"],
    ],
    { origin: { c: 0, r: 21 } }
  );
  const cellA22 = XLSX.utils.encode_cell({ c: 0, r: 21 });
  // console.log("exportAllExpensesToXLSX ~ cellA22", cellA22);
  // console.log(sheet[cellA22]);
  return true;
}
