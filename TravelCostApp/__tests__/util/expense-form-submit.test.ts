import { DateTime } from "luxon";
import { getCatLocalized } from "../../util/category";
import { makeExpense } from "../fixtures/expense";
import { makeExpenseFormSnapshot } from "../fixtures/expense-form";
import {
  buildExpenseData,
  buildFastExpenseData,
  validateExpenseData,
} from "../../util/expense-form-submit";

function dateFromIso(iso: string): Date {
  return DateTime.fromISO(iso).toJSDate();
}

describe("buildExpenseData", () => {
  it("assembles advanced-path ExpenseData from resolved form state", () => {
    const snapshot = makeExpenseFormSnapshot();
    const built = buildExpenseData(snapshot);

    expect(built.uid).toBe("u1");
    expect(built.amount).toBe(42.5);
    expect(built.calcAmount).toBe(42.5);
    expect(built.category).toBe("Food");
    expect(built.categoryString).toBe("Food");
    expect(built.description).toBe("Lunch");
    expect(built.country).toBe("DE");
    expect(built.currency).toBe("EUR");
    expect(built.whoPaid).toBe("Alice");
    expect(built.splitType).toBe("EQUAL");
    expect(built.listEQUAL).toEqual(["Alice", "Bob"]);
    expect(built.splitList).toEqual([{ userName: "Alice", amount: 21.25 }]);
    expect(built.duplOrSplit).toBe(0);
    expect(built.iconName).toBe("food");
    expect(built.paidBack).toBe("not paid");
    expect(built.isSpecialExpense).toBe(false);
    expect(built.alreadyDividedAmountByDays).toBe(false);
    expect(built.date).toEqual(dateFromIso("2026-01-15"));
    expect(built.startDate).toEqual(dateFromIso("2026-01-15"));
    expect(built.endDate).toEqual(dateFromIso("2026-01-16"));
  });

  it("uses pickedCat for category when newCat is true", () => {
    const built = buildExpenseData(
      makeExpenseFormSnapshot({
        newCat: true,
        pickedCat: "custom-cat",
        categoryInput: "Food",
      })
    );

    expect(built.category).toBe("custom-cat");
    expect(built.categoryString).toBe("Food");
  });

  it("defaults whoPaid to userName for solo travellers or null whoPaid", () => {
    const solo = buildExpenseData(
      makeExpenseFormSnapshot({
        isSoloTraveller: true,
        whoPaid: "Bob",
        userName: "Alice",
      })
    );
    expect(solo.whoPaid).toBe("Alice");

    const nullWhoPaid = buildExpenseData(
      makeExpenseFormSnapshot({
        whoPaid: null,
        userName: "Alice",
      })
    );
    expect(nullWhoPaid.whoPaid).toBe("Alice");
  });

  it("fills empty description from localized category label", () => {
    const built = buildExpenseData(
      makeExpenseFormSnapshot({
        description: "",
        categoryInput: "Food",
        newCat: false,
      })
    );

    expect(built.description).toBe(getCatLocalized("Food"));
  });

  it("coerces numeric amountValue like the hasTempAndInput sum path", () => {
    const built = buildExpenseData(
      makeExpenseFormSnapshot({ amountValue: 100 })
    );

    expect(built.amount).toBe(100);
    expect(built.calcAmount).toBe(100);
  });

  it("falls back to now for empty or invalid date ISO strings", () => {
    const fixedNow = DateTime.fromISO("2026-06-15T10:00:00.000Z");
    const nowSpy = jest
      .spyOn(DateTime, "now")
      .mockReturnValue(fixedNow as DateTime<true>);

    const built = buildExpenseData(
      makeExpenseFormSnapshot({
        dateIso: "",
        startDateIso: "not-a-date",
        endDateIso: "",
      })
    );

    expect(built.date).toEqual(fixedNow.toJSDate());
    expect(built.startDate).toEqual(fixedNow.toJSDate());
    expect(built.endDate).toEqual(fixedNow.toJSDate());

    nowSpy.mockRestore();
  });
});

describe("buildFastExpenseData", () => {
  it("assembles fast-path ExpenseData with the same core fields as advanced submit", () => {
    const snapshot = makeExpenseFormSnapshot({
      pickedCat: "food",
      lastCountry: "FR",
      lastCurrency: "USD",
      userName: "Bob",
      listEQUAL: ["Bob", "Carol"],
    });
    const built = buildFastExpenseData(snapshot);
    const rangeStart = dateFromIso("2026-01-15");

    expect(built).toEqual({
      uid: "u1",
      amount: 42.5,
      calcAmount: 42.5,
      date: rangeStart,
      startDate: rangeStart,
      endDate: dateFromIso("2026-01-16"),
      description: "Lunch",
      category: "food",
      categoryString: getCatLocalized("food"),
      country: "FR",
      currency: "USD",
      whoPaid: "Bob",
      splitType: "EQUAL",
      listEQUAL: ["Bob", "Carol"],
      splitList: [{ userName: "Alice", amount: 21.25 }],
      iconName: "food",
      paidBack: "not paid",
      isSpecialExpense: false,
      duplOrSplit: 0,
      alreadyDividedAmountByDays: false,
    });
  });

  it("uses empty country when lastCountry is unset", () => {
    const built = buildFastExpenseData(
      makeExpenseFormSnapshot({ lastCountry: "" })
    );

    expect(built.country).toBe("");
  });

  it("keeps user-edited description instead of overwriting with category label", () => {
    const built = buildFastExpenseData(
      makeExpenseFormSnapshot({
        pickedCat: "food",
        description: "Coffee with Ana",
      })
    );

    expect(built.description).toBe("Coffee with Ana");
  });

  it("fills empty description from localized category label", () => {
    const built = buildFastExpenseData(
      makeExpenseFormSnapshot({
        pickedCat: "food",
        description: "",
      })
    );

    expect(built.description).toBe(getCatLocalized("food"));
  });
});

describe("validateExpenseData", () => {
  it("marks a well-formed expense as valid", () => {
    const result = validateExpenseData(makeExpense());

    expect(result.valid).toBe(true);
    expect(result.fieldValidity).toEqual({
      amount: true,
      date: true,
      description: true,
      whoPaid: true,
      category: true,
      country: true,
      currency: true,
    });
  });

  it("rejects invalid amount, date, and empty description", () => {
    const invalid = makeExpense({
      amount: 0,
      date: new Date("not-a-date"),
      description: "   ",
    });
    const result = validateExpenseData(invalid);

    expect(result.valid).toBe(false);
    expect(result.fieldValidity.amount).toBe(false);
    expect(result.fieldValidity.date).toBe(false);
    expect(result.fieldValidity.description).toBe(false);
    expect(result.fieldValidity.whoPaid).toBe(true);
    expect(result.fieldValidity.category).toBe(true);
    expect(result.fieldValidity.country).toBe(true);
    expect(result.fieldValidity.currency).toBe(true);
  });

  it("rejects amounts at or above the upper bound", () => {
    const result = validateExpenseData(
      makeExpense({ amount: 34359738368 })
    );

    expect(result.fieldValidity.amount).toBe(false);
    expect(result.valid).toBe(false);
  });
});
