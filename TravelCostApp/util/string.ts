export function formatExpenseString(amount: number) {
  amount = Number(amount);
  if (!amount) return "0 ";
  let expensesSumString = amount.toFixed(2) + " ";
  if (amount.toFixed(2).toString().length > 5)
    expensesSumString = amount.toFixed(0).toString() + " ";
  if (amount.toFixed(0).toString().length > 4)
    expensesSumString = amount.toFixed(0).toString().slice(0, -3) + "K ";
  if (amount.toFixed(0).toString().length > 7)
    expensesSumString = amount.toFixed(0).toString().slice(0, -6) + "M ";
  if (amount.toFixed(0).toString().length > 10)
    expensesSumString = amount.toFixed(0).toString().slice(0, -9) + "B ";
  return expensesSumString;
}

export function truncateString(str: string, n: number) {
  if (!str || str.length < 1) return;
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}
