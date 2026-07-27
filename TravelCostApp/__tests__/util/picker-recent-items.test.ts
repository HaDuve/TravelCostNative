import { makeExpense } from "../fixtures/expense";
import {
  getRecentPickerCountries,
  getRecentPickerCurrencies,
} from "../../util/picker-recent-items";

describe("getRecentPickerCountries", () => {
  it("pins last-used country first, then unique countries from newest expenses, capped at 5", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        country: "FR",
        date: new Date("2026-01-10T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e2",
        country: "DE",
        date: new Date("2026-01-15T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e3",
        country: "US",
        date: new Date("2026-01-12T12:00:00.000Z"),
      }),
    ];

    expect(getRecentPickerCountries(expenses, "IT")).toEqual([
      "IT",
      "DE",
      "US",
      "FR",
    ]);
  });

  it("dedupes when last-used country already appears in recent expenses", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        country: "DE",
        date: new Date("2026-01-15T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e2",
        country: "US",
        date: new Date("2026-01-12T12:00:00.000Z"),
      }),
    ];

    expect(getRecentPickerCountries(expenses, "DE")).toEqual(["DE", "US"]);
  });

  it("skips deleted expenses and expenses without a country", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        country: "DE",
        date: new Date("2026-01-15T12:00:00.000Z"),
        isDeleted: true,
      }),
      makeExpense({
        id: "e2",
        country: "",
        date: new Date("2026-01-14T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e3",
        country: "US",
        date: new Date("2026-01-13T12:00:00.000Z"),
      }),
    ];

    expect(getRecentPickerCountries(expenses, "")).toEqual(["US"]);
  });

  it("treats country codes and English names as the same place", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        country: "Germany",
        date: new Date("2026-01-15T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e2",
        country: "US",
        date: new Date("2026-01-12T12:00:00.000Z"),
      }),
    ];

    expect(getRecentPickerCountries(expenses, "DE")).toEqual(["DE", "US"]);
  });
});

describe("getRecentPickerCurrencies", () => {
  it("pins last-used currency first, then unique currencies from newest expenses, capped at 5", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        currency: "GBP",
        date: new Date("2026-01-10T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e2",
        currency: "EUR",
        date: new Date("2026-01-15T12:00:00.000Z"),
      }),
      makeExpense({
        id: "e3",
        currency: "USD",
        date: new Date("2026-01-12T12:00:00.000Z"),
      }),
    ];

    expect(getRecentPickerCurrencies(expenses, "JPY")).toEqual([
      "JPY",
      "EUR",
      "USD",
      "GBP",
    ]);
  });

  it("returns at most 5 currencies", () => {
    const expenses = [
      makeExpense({ id: "e1", currency: "EUR", date: new Date("2026-01-20") }),
      makeExpense({ id: "e2", currency: "USD", date: new Date("2026-01-19") }),
      makeExpense({ id: "e3", currency: "GBP", date: new Date("2026-01-18") }),
      makeExpense({ id: "e4", currency: "JPY", date: new Date("2026-01-17") }),
      makeExpense({ id: "e5", currency: "CHF", date: new Date("2026-01-16") }),
      makeExpense({ id: "e6", currency: "CAD", date: new Date("2026-01-15") }),
    ];

    expect(getRecentPickerCurrencies(expenses, "AUD")).toHaveLength(5);
    expect(getRecentPickerCurrencies(expenses, "AUD")).toEqual([
      "AUD",
      "EUR",
      "USD",
      "GBP",
      "JPY",
    ]);
  });
});
