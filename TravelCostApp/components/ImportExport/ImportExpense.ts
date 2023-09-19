import { storeExpense } from "../../util/http";

export async function importExpenseFromXLSX(
  excelData,
  uid,
  tripid,
  userName,
  addExpense
) {
  for (let i = 0; i < excelData?.length; i++) {
    const catArray = excelData[i];
    importCategory(catArray, uid, tripid, userName, addExpense);
  }
}

export async function importCategory(
  catArray,
  uid,
  tripid,
  userName,
  addExpense
) {
  async function storeImportedExpense(expenseData) {
    await storeExpense(tripid, uid, expenseData);
  }

  const { DateTime } = require("luxon");
  for (let i = 0; i < catArray?.length; i++) {
    const expenseObj = catArray[i];
    //cat //cost //text
    // if text = newDate() then replace text with cat
    // if text is not a date, dont add category to text
    // match cat if possible
    const dateText = expenseObj.text.replace("/", "-").replace("/", "-");
    const date = DateTime.fromFormat(dateText, "MM-dd-yy");
    const jsDate = !date ? null : date.toJSDate();
    const invalidDate =
      isNaN(jsDate) || !jsDate || !date || date === null || date === "null";
    const expenseData = {
      uid: uid,
      amount: +expenseObj.cost,
      calcAmount: +expenseObj.cost,
      date: invalidDate ? new Date() : jsDate, // TODO: change this to the first day of the trip
      endDate: invalidDate ? new Date() : jsDate,
      description: invalidDate ? expenseObj.text : expenseObj.cat,
      category: expenseObj.cat,
      country: "",
      currency: "EUR",
      whoPaid: userName,
      splitType: "SELF",
      listEQUAL: [userName],
      splitList: [],
    };
    console.log("expenseObj.cat", expenseObj.cat);
    await storeImportedExpense(expenseData);
  }
}
