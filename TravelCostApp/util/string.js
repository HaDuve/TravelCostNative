export function formatExpenseString(amount) {
  let expensesSumString = amount.toFixed(2) + " ";
  if (expensesSumString.toString() > 5)
    expensesSumString = amount.toFixed(0).toString() + " ";
  if (amount.toFixed(0).toString().length > 4)
    expensesSumString = amount.toFixed(0).toString().slice(0, -3) + "k ";
  return expensesSumString;
}
