jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en" }],
}));

import { DateTime } from "luxon";
import { i18n } from "../../i18n/i18n";
import { paidBackStatus } from "../../util/expense";
import { makeExpense } from "../fixtures/expense";
import { makeExpenseFormSnapshot } from "../fixtures/expense-form";
import {
  applyDraftToForm,
  summarizeDraftChanges,
  toExpenseDraft,
} from "../../util/expense-form-draft";

function dateFromIso(iso: string): Date {
  return DateTime.fromISO(iso).toJSDate();
}

describe("toExpenseDraft", () => {
  it("persists the same ExpenseData shape as ExpenseForm saveDraftData", () => {
    const draft = toExpenseDraft(makeExpenseFormSnapshot());

    expect(draft.category).toBe("Food");
    expect(draft.categoryString).toBe("Food");
    expect(draft.description).toBe("Lunch");
    expect(draft.amount).toBe(42.5);
    expect(draft.calcAmount).toBe(42.5);
    expect(draft.country).toBe("DE");
    expect(draft.currency).toBe("EUR");
    expect(draft.whoPaid).toBe("Alice");
    expect(draft.splitType).toBe("EQUAL");
    expect(draft.listEQUAL).toEqual(["Alice", "Bob"]);
    expect(draft.splitList).toEqual([{ userName: "Alice", amount: 21.25 }]);
    expect(draft.duplOrSplit).toBe(0);
    expect(draft.paidBack).toBe("not paid");
    expect(draft.isSpecialExpense).toBe(false);
    expect(draft.date).toEqual(dateFromIso("2026-01-15"));
    expect(draft.startDate).toEqual(dateFromIso("2026-01-15"));
    expect(draft.endDate).toEqual(dateFromIso("2026-01-16"));
  });

  it("keeps display amount separate from resolved calcAmount when amountInput differs", () => {
    const draft = toExpenseDraft(
      makeExpenseFormSnapshot({
        amountInput: "10",
        amountValue: 25,
      })
    );

    expect(draft.amount).toBe(10);
    expect(draft.calcAmount).toBe(25);
  });
});

describe("applyDraftToForm", () => {
  it("maps persisted draft fields into form input state", () => {
    const restored = applyDraftToForm(makeExpense());

    expect(restored.inputs?.amount).toEqual({ value: "100", isValid: true });
    expect(restored.inputs?.description).toEqual({
      value: "dinner",
      isValid: true,
    });
    expect(restored.inputs?.category).toEqual({
      value: "Food",
      isValid: true,
    });
    expect(restored.inputs?.country).toEqual({ value: "", isValid: true });
    expect(restored.inputs?.currency).toEqual({ value: "EUR", isValid: true });
    expect(restored.inputs?.whoPaid).toEqual({ value: "Alice", isValid: true });
    expect(restored.inputs?.date?.value).toBe(
      new Date("2026-01-15T12:00:00.000Z").toISOString()
    );
    expect(restored.splitType).toBe("EQUAL");
    expect(restored.splitList).toEqual([
      { userName: "Alice", amount: 50 },
      { userName: "Bob", amount: 50 },
    ]);
    expect(restored.listEQUAL).toBeUndefined();
    expect(restored.paidBack).toBeUndefined();
    expect(restored.isSpecialExpense).toBe(false);
    expect(restored.startDate).toBe(
      new Date("2026-01-15T12:00:00.000Z").toISOString()
    );
    expect(restored.endDate).toBe(
      new Date("2026-01-15T12:00:00.000Z").toISOString()
    );
    expect(restored.calcAmount).toBe("100");
  });
});

describe("draft round-trip", () => {
  it("restores equivalent form state from snapshot via draft persistence", () => {
    const snapshot = makeExpenseFormSnapshot({
      amountInput: "10",
      amountValue: 25,
    });
    const restored = applyDraftToForm(toExpenseDraft(snapshot));

    expect(restored.inputs?.amount?.value).toBe("10");
    expect(restored.inputs?.description?.value).toBe(snapshot.description);
    expect(restored.inputs?.category?.value).toBe(snapshot.categoryInput);
    expect(restored.inputs?.country?.value).toBe(snapshot.country);
    expect(restored.inputs?.currency?.value).toBe(snapshot.currency);
    expect(restored.inputs?.whoPaid?.value).toBe(snapshot.whoPaid);
    expect(restored.splitType).toBe(snapshot.splitType);
    expect(restored.listEQUAL).toEqual(snapshot.listEQUAL);
    expect(restored.splitList).toEqual(snapshot.splitList);
    expect(restored.duplOrSplit).toBe(snapshot.duplOrSplit);
    expect(restored.paidBack).toBe(snapshot.paidBack);
    expect(restored.isSpecialExpense).toBe(snapshot.isSpecialExpense);
    expect(restored.calcAmount).toBe("25");
    expect(restored.startDate).toBe(
      dateFromIso(snapshot.startDateIso).toISOString()
    );
    expect(restored.endDate).toBe(
      dateFromIso(snapshot.endDateIso).toISOString()
    );
  });
});

describe("summarizeDraftChanges", () => {
  const baseline = { lastCountry: "DE", lastCurrency: "EUR" };

  it("lists changed draft fields with localized labels", () => {
    const lines = summarizeDraftChanges(
      makeExpense({
        amount: 50,
        description: "coffee",
        category: "Food",
        currency: "USD",
        country: "US",
        whoPaid: "Bob",
        splitType: "EXACT",
        paidBack: paidBackStatus.paid,
        isSpecialExpense: true,
      }),
      baseline
    );

    expect(lines).toEqual([
      `• ${i18n.t("amount")}: 50`,
      `• ${i18n.t("description")}: coffee`,
      `• ${i18n.t("category")}: Food`,
      `• ${i18n.t("currency")}: USD`,
      `• ${i18n.t("country")}: US`,
      `• ${i18n.t("whoPaid")}: Bob`,
      `• ${i18n.t("splitType")}: ${i18n.t("exact")}`,
      `• ${i18n.t("paymentStatus")}: ${i18n.t("paid")}`,
      `• ${i18n.t("specialExpense")}: ${i18n.t("yes")}`,
    ]);
  });

  it("omits fields that match baseline or default sentinels", () => {
    const lines = summarizeDraftChanges(
      makeExpense({
        amount: 0,
        description: "",
        category: "undefined",
        currency: "EUR",
        country: "DE",
        whoPaid: "",
        splitType: "SELF",
        paidBack: paidBackStatus.notPaid,
        isSpecialExpense: false,
      }),
      baseline
    );

    expect(lines).toEqual([]);
  });
});
