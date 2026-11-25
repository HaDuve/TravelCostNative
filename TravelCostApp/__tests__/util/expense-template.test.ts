import { buildTemplateExpenseData } from "../../util/expense-template";
import { makeExpense } from "../fixtures/expense";

describe("Template expense", () => {
  const now = new Date("2026-01-20T10:00:00.000Z");

  it("copies the picked Expense, resets dates to now and drops id, rangeId and editedTimestamp", () => {
    const original = makeExpense({
      id: "e1",
      rangeId: "r1",
      editedTimestamp: 123,
      description: "Coffee",
      amount: 4.5,
    });

    const data = buildTemplateExpenseData(original, now);

    expect(data).toMatchObject({ description: "Coffee", amount: 4.5 });
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("rangeId");
    expect(data).not.toHaveProperty("editedTimestamp");
    expect(data.date).toBe(now.toISOString());
    expect(data.startDate).toBe(now.toISOString());
    expect(data.endDate).toBe(now.toISOString());
  });

  it("does not mutate the picked Expense", () => {
    const original = makeExpense({ id: "e1" });
    buildTemplateExpenseData(original, now);
    expect(original.id).toBe("e1");
  });
});
