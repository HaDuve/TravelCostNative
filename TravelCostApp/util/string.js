export function formatExpenseString(amount) {
  let expensesSumString = amount.toFixed(2) + " ";
  if (expensesSumString.toString() > 5)
    expensesSumString = amount.toFixed(0).toString() + " ";
  return expensesSumString;
}
