import {
  buildProfileLocalPriceGptParams,
  localPriceLookupSpanPhrase,
  parseCountryFromPickerValue,
  parseCurrencyFromPickerValue,
} from "../../util/profile-local-price-submit";

describe("localPriceLookupSpanPhrase", () => {
  it("is empty for a single day", () => {
    expect(localPriceLookupSpanPhrase(1)).toBe("");
  });

  it("describes a multi-day span", () => {
    expect(localPriceLookupSpanPhrase(7)).toBe(" for a 7-day period");
  });
});

describe("parseCountryFromPickerValue", () => {
  it("returns English country name before localized suffix", () => {
    expect(parseCountryFromPickerValue("Thailand - ไทย")).toBe("Thailand");
  });
});

describe("parseCurrencyFromPickerValue", () => {
  it("returns ISO code from picker label", () => {
    expect(parseCurrencyFromPickerValue("USD | $ - US Dollar")).toBe("USD");
  });
});

describe("buildProfileLocalPriceGptParams", () => {
  const defaults = { country: "Germany", currency: "EUR" };

  it("uses defaults when advanced options stay collapsed", () => {
    expect(
      buildProfileLocalPriceGptParams("Coffee", defaults, {}, false),
    ).toEqual({
      product: "Coffee",
      country: "Germany",
      currency: "EUR",
      inclusiveDayCount: 1,
      price: "",
    });
  });

  it("uses picker values when advanced options are expanded", () => {
    expect(
      buildProfileLocalPriceGptParams(
        "Coworking",
        defaults,
        {
          countryPickerValue: "Thailand - ไทย",
          currencyPickerValue: "THB | ฿",
        },
        true,
      ),
    ).toEqual({
      product: "Coworking",
      country: "Thailand",
      currency: "THB",
      inclusiveDayCount: 1,
      price: "",
    });
  });

  it("passes inclusive day count from an expanded date range", () => {
    expect(
      buildProfileLocalPriceGptParams(
        "Apartment rental",
        defaults,
        {
          startDate: "2026-08-01",
          endDate: "2026-08-07",
        },
        true,
      ),
    ).toMatchObject({
      product: "Apartment rental",
      inclusiveDayCount: 7,
    });
  });
});
