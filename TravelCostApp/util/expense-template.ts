import type { ExpenseData } from "./expense";
import { safelyParseJSON } from "./jsonParse";

/**
 * Prefills a new **Expense** from a picked template Expense: deep copy, dates
 * reset to `now`, and identity (id, rangeId, editedTimestamp) dropped.
 */
export function buildTemplateExpenseData(
  item: ExpenseData,
  now: Date = new Date()
): ExpenseData {
  const data: ExpenseData = safelyParseJSON(JSON.stringify(item));
  const iso = now.toISOString() as unknown as ExpenseData["date"];
  data.date = iso;
  data.startDate = iso;
  data.endDate = iso;
  delete data.id;
  delete data.rangeId;
  delete data.editedTimestamp;
  return data;
}
