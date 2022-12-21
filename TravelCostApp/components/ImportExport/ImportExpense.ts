import { storeExpense } from "../../util/http";

export async function importExpenseFromXLSX(
  excelData,
  uid,
  tripid,
  userName,
  addExpense
) {
  for (let i = 0; i < excelData.length; i++) {
    const catArray = excelData[i];
    console.log("catArray", catArray);
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

  for (let i = 0; i < catArray.length; i++) {
    const expenseObj = catArray[i];
    //cat //cost //text
    const expenseData = {
      uid: uid,
      amount: +expenseObj.cost,
      calcAmount: +expenseObj.cost,
      date: new Date(),
      endDate: new Date(),
      description: expenseObj.text + " - " + expenseObj.cat,
      category: expenseObj.cat,
      country: "",
      currency: "EUR",
      whoPaid: userName,
      owePerc: 0,
      splitType: "SELF",
      listEQUAL: [userName],
      splitList: [],
    };
    await storeImportedExpense(expenseData);
  }
}

// For reference

// ~~ From ExpenseForm
// function fastSubmit() {
//   const expenseData = {
//     uid: AuthCtx.uid,
//     amount: +inputs.amount.value,
//     date: new Date(),
//     endDate: new Date(),
//     description: pickedCat,
//     category: pickedCat,
//     country: UserCtx.lastCountry ? UserCtx.lastCountry : UserCtx.homeCountry,
//     currency: UserCtx.lastCurrency
//       ? UserCtx.lastCurrency
//       : TripCtx.tripCurrency,
//     whoPaid: UserCtx.userName,
//     owePerc: "0",
//     splitType: "SELF",
//     listEQUAL: currentTravellers,
//     splitList: [],
//   };
//   onSubmit(expenseData);
// }

// ~~From ManageExpense
//   const id = await storeExpense(tripid, uid, expenseData);
//   expenseCtx.addExpense({ ...expenseData, id: id });
