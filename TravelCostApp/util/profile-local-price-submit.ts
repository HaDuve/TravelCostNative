import { countInclusiveDaysInRange } from "./expense-form-range";

export type ProfileLocalPriceDefaults = {
  country: string;
  currency: string;
};

export type ProfileLocalPriceAdvancedInput = {
  countryPickerValue?: string;
  currencyPickerValue?: string;
  startDate?: string;
  endDate?: string;
};

export type ProfileLocalPriceGptParams = {
  product: string;
  country: string;
  currency: string;
  inclusiveDayCount: number;
  price: string;
};

export function parseCountryFromPickerValue(
  pickerValue?: string,
): string | null {
  const trimmed = pickerValue?.trim();
  if (!trimmed) return null;
  return trimmed.split("- ")[0]?.trim() ?? null;
}

export function parseCurrencyFromPickerValue(
  pickerValue?: string,
): string | null {
  const trimmed = pickerValue?.trim();
  if (!trimmed) return null;
  return trimmed.split("- ")[0]?.split(" ")[0]?.trim() ?? null;
}

/** Duration phrase for profile local-price lookup when a date span is chosen. */
export function localPriceLookupSpanPhrase(inclusiveDayCount: number): string {
  if (inclusiveDayCount <= 1) return "";
  return ` for a ${inclusiveDayCount}-day period`;
}

export function buildProfileLocalPriceGptParams(
  product: string,
  defaults: ProfileLocalPriceDefaults,
  advanced: ProfileLocalPriceAdvancedInput = {},
  advancedExpanded = false,
): ProfileLocalPriceGptParams {
  let country = defaults.country;
  let currency = defaults.currency;
  let inclusiveDayCount = 1;

  if (advancedExpanded) {
    const pickedCountry = parseCountryFromPickerValue(
      advanced.countryPickerValue,
    );
    const pickedCurrency = parseCurrencyFromPickerValue(
      advanced.currencyPickerValue,
    );
    if (pickedCountry) country = pickedCountry;
    if (pickedCurrency) currency = pickedCurrency;

    if (advanced.startDate && advanced.endDate) {
      inclusiveDayCount = countInclusiveDaysInRange(
        new Date(advanced.startDate),
        new Date(advanced.endDate),
      );
    }
  }

  return {
    product: product.trim(),
    country,
    currency,
    inclusiveDayCount,
    price: "",
  };
}
