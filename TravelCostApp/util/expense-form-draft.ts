import { DateTime } from "luxon";
import { i18n } from "../i18n/i18n";
import { getCatLocalized } from "./category";
import type { ExpenseFormSnapshot } from "./expense-form-submit";
import {
  ExpenseData,
  paidBackStatus,
} from "./expense";
import { DateOrDateTime } from "./date";
import { resetEditOrder, splitType } from "./split";

export type FormFieldState = {
  value: string;
  isValid: boolean;
};

export type ExpenseFormDraftRestore = {
  inputs: {
    amount: FormFieldState;
    description: FormFieldState;
    date: FormFieldState;
    category: FormFieldState;
    country: FormFieldState;
    currency: FormFieldState;
    whoPaid: FormFieldState;
  };
  splitType?: splitType;
  listEQUAL?: string[];
  splitList?: ReturnType<typeof resetEditOrder>;
  duplOrSplit?: ExpenseData["duplOrSplit"];
  paidBack?: paidBackStatus;
  isSpecialExpense?: boolean;
  startDate?: string;
  endDate?: string;
  calcAmount?: string;
};

function createSafeDate(dateValue: string): Date {
  if (dateValue && dateValue !== "") {
    const parsedDate = DateTime.fromISO(dateValue);
    return parsedDate.isValid
      ? parsedDate.toJSDate()
      : DateTime.now().toJSDate();
  }
  return DateTime.now().toJSDate();
}

export function toExpenseDraft(
  snapshot: ExpenseFormSnapshot,
  overrides: Partial<ExpenseData> = {}
): ExpenseData {
  const amountInput = snapshot.amountInput ?? snapshot.amountValue;
  const resolvedAmount = +snapshot.amountValue;

  return {
    category: snapshot.categoryInput,
    description: snapshot.description,
    amount: +amountInput,
    date: createSafeDate(snapshot.dateIso),
    startDate: createSafeDate(snapshot.startDateIso),
    endDate: createSafeDate(snapshot.endDateIso),
    country: snapshot.country,
    currency: snapshot.currency,
    whoPaid: snapshot.whoPaid as string,
    splitType: snapshot.splitType,
    listEQUAL: snapshot.listEQUAL,
    splitList: snapshot.splitList,
    duplOrSplit: snapshot.duplOrSplit,
    calcAmount: resolvedAmount,
    paidBack: snapshot.paidBack,
    isSpecialExpense: snapshot.isSpecialExpense,
    categoryString: snapshot.categoryInput,
    ...overrides,
  };
}

function convertToISOString(dateValue: DateOrDateTime): string {
  if (typeof dateValue === "string") {
    return dateValue;
  }
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  if (dateValue && typeof (dateValue as { toJSDate?: () => Date }).toJSDate === "function") {
    return (dateValue as { toJSDate: () => Date }).toJSDate().toISOString();
  }
  return new Date(dateValue as string | number).toISOString();
}

function readDraftPaidBack(
  draft: ExpenseData
): paidBackStatus | undefined {
  return (
    draft.paidBack ??
    (draft as ExpenseData & { isPaid?: paidBackStatus }).isPaid
  );
}

export function applyDraftToForm(
  draft: ExpenseData
): Partial<ExpenseFormDraftRestore> {
  const draftPaidBack = readDraftPaidBack(draft);
  const restored: Partial<ExpenseFormDraftRestore> = {
    inputs: {
      amount: {
        value: draft.amount?.toString() || "",
        isValid: true,
      },
      description: {
        value: draft.description || "",
        isValid: true,
      },
      date: {
        value: draft.date ? convertToISOString(draft.date) : "",
        isValid: true,
      },
      category: { value: draft.category || "", isValid: true },
      country: { value: draft.country || "", isValid: true },
      currency: { value: draft.currency || "", isValid: true },
      whoPaid: { value: draft.whoPaid || "", isValid: true },
    },
  };

  if (draft.splitType) {
    restored.splitType = draft.splitType;
  }
  if (draft.listEQUAL) {
    restored.listEQUAL = draft.listEQUAL;
  }
  if (draft.splitList) {
    restored.splitList = resetEditOrder(draft.splitList);
  }
  if (draft.duplOrSplit !== undefined) {
    restored.duplOrSplit = draft.duplOrSplit;
  }
  if (draftPaidBack) {
    restored.paidBack = draftPaidBack;
  }
  if (draft.isSpecialExpense !== undefined) {
    restored.isSpecialExpense = draft.isSpecialExpense;
  }
  if (draft.startDate) {
    restored.startDate = convertToISOString(draft.startDate);
  }
  if (draft.endDate) {
    restored.endDate = convertToISOString(draft.endDate);
  }
  if (draft.calcAmount) {
    restored.calcAmount = draft.calcAmount.toString();
  }

  return restored;
}

export type DraftChangeBaseline = {
  lastCountry: string;
  lastCurrency: string;
};

export function summarizeDraftChanges(
  draft: ExpenseData,
  baseline: DraftChangeBaseline
): string[] {
  const draftPaidBack = readDraftPaidBack(draft);
  const changedItems: string[] = [];

  if (draft.amount && draft.amount !== 0) {
    changedItems.push(`• ${i18n.t("amount")}: ${draft.amount}`);
  }
  if (draft.description && draft.description !== "") {
    changedItems.push(`• ${i18n.t("description")}: ${draft.description}`);
  }
  if (draft.category && draft.category !== "undefined") {
    const categoryName = getCatLocalized(draft.category);
    changedItems.push(`• ${i18n.t("category")}: ${categoryName}`);
  }
  if (draft.currency && draft.currency !== baseline.lastCurrency) {
    changedItems.push(`• ${i18n.t("currency")}: ${draft.currency}`);
  }
  if (draft.country && draft.country !== baseline.lastCountry) {
    changedItems.push(`• ${i18n.t("country")}: ${draft.country}`);
  }
  if (draft.whoPaid && draft.whoPaid !== "") {
    changedItems.push(`• ${i18n.t("whoPaid")}: ${draft.whoPaid}`);
  }
  if (draft.splitType && draft.splitType !== "SELF") {
    const splitTypeText =
      draft.splitType === "EQUAL"
        ? i18n.t("equal")
        : draft.splitType === "EXACT"
          ? i18n.t("exact")
          : draft.splitType;
    changedItems.push(`• ${i18n.t("splitType")}: ${splitTypeText}`);
  }
  if (draftPaidBack && draftPaidBack !== paidBackStatus.notPaid) {
    const paidText =
      draftPaidBack === paidBackStatus.paid
        ? i18n.t("paid")
        : i18n.t("notPaidLabel");
    changedItems.push(`• ${i18n.t("paymentStatus")}: ${paidText}`);
  }
  if (draft.isSpecialExpense) {
    changedItems.push(`• ${i18n.t("specialExpense")}: ${i18n.t("yes")}`);
  }

  return changedItems;
}
