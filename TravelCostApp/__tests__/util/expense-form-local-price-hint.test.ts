import { expenseFormLocalPriceHint } from "../../util/expense-form-local-price-hint";
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
});
