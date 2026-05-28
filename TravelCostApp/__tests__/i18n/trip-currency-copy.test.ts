import { readFileSync } from "fs";
import { join } from "path";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";

const appRoot = join(__dirname, "../..");

/** Trip-currency UI copy (issue #221) — traveller home currency, not destination/base. */
const tripCurrencyCopy = (locale: Record<string, string>) => [
  locale.selectCurrencyAlert,
  locale.alertChangeHomeCurrencyTitle,
  locale.alertChangeHomeCurrencyMessage,
  locale.baseCurrencyLabel,
  locale.baseCurrency,
  locale.infoHomeCurrencyTitle,
  locale.infoHomeCurrencyText,
  locale.alertSameCurrencyTrips,
]
  .filter(Boolean)
  .join("\n");

describe("trip currency i18n (issue #221)", () => {
  describe("English", () => {
    it("selectCurrencyAlert uses home-currency wording, not base currency", () => {
      expect(en.selectCurrencyAlert).toMatch(/home currency/i);
      expect(en.selectCurrencyAlert).not.toMatch(/base currency/i);
    });

    it("trip-currency touchpoints avoid ambiguous base/local currency phrasing", () => {
      const copy = tripCurrencyCopy(en);
      expect(copy).not.toMatch(/base currency/i);
      expect(copy).not.toMatch(/local currency/i);
      expect(copy).not.toMatch(/destination/i);
    });
  });

  describe("German (reference)", () => {
    it("trip-currency touchpoints use Heimatwährung, not Basiswährung", () => {
      const copy = tripCurrencyCopy({
        ...de,
        baseCurrencyLabel: de.tripCurrencyLabel ?? "",
      });
      expect(copy).toMatch(/Heimatwährung/i);
      expect(copy).not.toMatch(/Basiswährung/i);
    });
  });

  describe("French", () => {
    it("trip-currency touchpoints avoid local/base currency phrasing", () => {
      const copy = tripCurrencyCopy(fr);
      expect(copy).not.toMatch(/devise locale/i);
      expect(copy).not.toMatch(/devise de base/i);
      expect(copy).toMatch(/domicile/i);
    });
  });

  describe("Russian", () => {
    it("trip-currency touchpoints use домашн, not базов", () => {
      const copy = tripCurrencyCopy(ru);
      expect(copy).toMatch(/домашн/i);
      expect(copy).not.toMatch(/базов/i);
    });
  });

  it("change-home-currency alert keys exist in every locale", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.alertChangeHomeCurrencyTitle).toBeTruthy();
      expect(locale.alertChangeHomeCurrencyMessage).toBeTruthy();
    }
  });

  it("TripForm updateCurrency uses i18n, not hardcoded English", () => {
    const tripForm = readFileSync(
      join(appRoot, "components/ManageTrip/TripForm.tsx"),
      "utf8"
    );
    expect(tripForm).not.toMatch(/"Changing Home Currency"/);
    expect(tripForm).toMatch(/alertChangeHomeCurrencyTitle/);
    expect(tripForm).toMatch(/alertChangeHomeCurrencyMessage/);
  });
});
