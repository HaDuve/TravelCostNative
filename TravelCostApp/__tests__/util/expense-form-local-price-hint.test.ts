import { expenseFormLocalPriceHint, localPriceDealAmountPhrase } from "../../util/expense-form-local-price-hint";
import { DuplicateOption } from "../../util/expense";
import { i18n } from "../../i18n/i18n";

describe("expenseFormLocalPriceHint", () => {
  beforeEach(() => {
    i18n.locale = "en";
  });

  it("describes the product and country when no amount is entered", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "Coffee",
        country: "Germany",
      })
    ).toBe('Get local price for "Coffee" in Germany');
  });

  it("includes price and currency when an amount is entered", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "Coworking",
        country: "Portugal",
        price: "25",
        currency: "EUR",
      })
    ).toBe('Is 25 EUR a good deal for "Coworking" in Portugal?');
  });

  it("includes per-day amount, day count, and sum for a ranged duplicate", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "hotel",
        country: "Spain",
        price: "80",
        currency: "EUR",
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.duplicate,
        alreadyDividedAmountByDays: false,
      })
    ).toBe(
      'Is 80 EUR over 3 days (sum 240 EUR) a good deal for "hotel" in Spain?'
    );
  });

  it("uses per-day amount when ranged-split field still holds the total", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "hotel",
        country: "Spain",
        price: "240",
        currency: "EUR",
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.split,
        alreadyDividedAmountByDays: false,
      })
    ).toBe(
      'Is 80 EUR over 3 days (sum 240 EUR) a good deal for "hotel" in Spain?'
    );
  });

  it("keeps per-day amount when editing an already-divided ranged split", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "hotel",
        country: "Spain",
        price: "80",
        currency: "EUR",
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.split,
        alreadyDividedAmountByDays: true,
      })
    ).toBe(
      'Is 80 EUR over 3 days (sum 240 EUR) a good deal for "hotel" in Spain?'
    );
  });

  it("omits day span when the expense is a single day", () => {
    expect(
      expenseFormLocalPriceHint({
        product: "hotel",
        country: "Spain",
        price: "80",
        currency: "EUR",
        inclusiveDayCount: 1,
        duplOrSplit: DuplicateOption.duplicate,
        alreadyDividedAmountByDays: false,
      })
    ).toBe('Is 80 EUR a good deal for "hotel" in Spain?');
  });
});

describe("localPriceDealAmountPhrase", () => {
  it("formats per-day amount with day count and sum for GPT prompts", () => {
    expect(
      localPriceDealAmountPhrase({
        price: "80",
        currency: "EUR",
        inclusiveDayCount: 3,
        duplOrSplit: DuplicateOption.duplicate,
        alreadyDividedAmountByDays: false,
      })
    ).toBe("80 EUR over 3 days (sum 240 EUR)");
  });
});
