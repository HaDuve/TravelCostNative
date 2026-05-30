import { DateTime } from "luxon";
import { makeExpense } from "../fixtures/expense";
import {
  hydrateExpenseFromNavigationDto,
  hydrateExpensesFromNavigationDtos,
  toExpenseNavigationDto,
  toExpenseNavigationDtos,
} from "../../util/expense-navigation-dto";

describe("expense navigation DTO round-trip", () => {
  it("serializes Date fields to ISO strings and hydrates back to equivalent ExpenseData", () => {
    const expense = makeExpense({
      id: "nav-1",
      date: new Date("2026-03-10T08:30:00.000Z"),
      startDate: new Date("2026-03-10T08:30:00.000Z"),
      endDate: new Date("2026-03-12T18:00:00.000Z"),
      description: "hostel",
    });

    const dto = toExpenseNavigationDto(expense);
    expect(dto.date).toBe("2026-03-10T08:30:00.000Z");
    expect(dto.startDate).toBe("2026-03-10T08:30:00.000Z");
    expect(dto.endDate).toBe("2026-03-12T18:00:00.000Z");
    expect(dto.description).toBe("hostel");

    const hydrated = hydrateExpenseFromNavigationDto(dto);
    expect(hydrated.id).toBe("nav-1");
    expect(hydrated.description).toBe("hostel");
    expect(hydrated.date).toEqual(new Date("2026-03-10T08:30:00.000Z"));
    expect(hydrated.startDate).toEqual(new Date("2026-03-10T08:30:00.000Z"));
    expect(hydrated.endDate).toEqual(new Date("2026-03-12T18:00:00.000Z"));
  });

  it("survives JSON round-trip like React Navigation persisted state", () => {
    const expenses = [
      makeExpense({ id: "a", date: new Date("2026-01-01T00:00:00.000Z") }),
      makeExpense({ id: "b", date: new Date("2026-01-02T00:00:00.000Z") }),
    ];

    const params = {
      expenses: toExpenseNavigationDtos(expenses),
      dayString: "Jan 2026",
    };
    const fromNavState = JSON.parse(JSON.stringify(params));

    const restored = hydrateExpensesFromNavigationDtos(fromNavState.expenses);
    expect(restored.map((e) => e.id)).toEqual(["a", "b"]);
    expect(restored[0].date).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(restored[1].date).toEqual(new Date("2026-01-02T00:00:00.000Z"));
  });

  it("serializes Luxon DateTime fields to ISO strings", () => {
    const expense = makeExpense({
      date: DateTime.fromISO("2026-05-20T12:00:00.000Z"),
      startDate: DateTime.fromISO("2026-05-20T12:00:00.000Z"),
      endDate: DateTime.fromISO("2026-05-21T12:00:00.000Z"),
    });

    const dto = toExpenseNavigationDto(expense);
    expect(dto.date).toBe("2026-05-20T12:00:00.000Z");
    expect(dto.endDate).toBe("2026-05-21T12:00:00.000Z");

    const hydrated = hydrateExpenseFromNavigationDto(dto);
    expect(hydrated.date).toEqual(new Date("2026-05-20T12:00:00.000Z"));
  });
});
