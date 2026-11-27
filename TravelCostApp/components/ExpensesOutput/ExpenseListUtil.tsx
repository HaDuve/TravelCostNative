const SHADOW_ID_PREFIX = "shadow";

/**
 * Whether a row is one of the blank padding rows that
 * `addShadowItemsToExpenses` appends to short lists, rather than an Expense.
 */
export function isShadowExpense(item: { id?: string } | undefined): boolean {
  return typeof item?.id === "string" && item.id.startsWith(SHADOW_ID_PREFIX);
}

export function addShadowItemsToExpenses(expenses) {
  // for scrolling utility
  expenses.push({
    id: "shadow1",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
  expenses.push({
    id: "shadow2",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
  expenses.push({
    id: "shadow3",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
  expenses.push({
    id: "shadow4",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
  expenses.push({
    id: "shadow5",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
  expenses.push({
    id: "shadow6",
    description: "",
    amount: 0,
    date: new Date(),
    currency: "",
    category: "",
    uid: "",
  });
}
