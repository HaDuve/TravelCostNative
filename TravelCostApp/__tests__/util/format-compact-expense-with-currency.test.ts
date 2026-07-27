import {
  formatCompactExpenseWithCurrency,
  formatExpenseWithCurrency,
} from "../../util/string";

describe("formatCompactExpenseWithCurrency", () => {
  it("renders a German thousands amount as 1,3k€", () => {
    expect(formatCompactExpenseWithCurrency(1300, "EUR", "de")).toBe("1,3k€");
  });

  it("renders a German millions amount as 1,3 Mio.€", () => {
    expect(formatCompactExpenseWithCurrency(1_300_000, "EUR", "de")).toBe(
      "1,3 Mio.€"
    );
  });

  it("renders an English thousands amount as €1.3k", () => {
    expect(formatCompactExpenseWithCurrency(1300, "EUR", "en")).toBe("€1.3k");
  });

  it("renders a German billions amount as 1,3 Mrd.€", () => {
    expect(formatCompactExpenseWithCurrency(1_300_000_000, "EUR", "de")).toBe(
      "1,3 Mrd.€"
    );
  });

  it("renders a French thousands amount as 1,3k€", () => {
    expect(formatCompactExpenseWithCurrency(1300, "EUR", "fr")).toBe("1,3k€");
  });

  it("does not compact amounts under 1000", () => {
    expect(formatCompactExpenseWithCurrency(999, "EUR", "de")).toBe(
      formatExpenseWithCurrency(999, "EUR", undefined, "de")
    );
  });

  it("rounds 9999 EUR in German to 10k€ not 10,0k€", () => {
    expect(formatCompactExpenseWithCurrency(9999, "EUR", "de")).toBe("10k€");
  });

  it("carries 999999 EUR in German to 1 Mio.€ not 1000,0k€", () => {
    expect(formatCompactExpenseWithCurrency(999_999, "EUR", "de")).toBe(
      "1 Mio.€"
    );
  });

  it("rounds 1999 EUR in German to 2k€", () => {
    expect(formatCompactExpenseWithCurrency(1999, "EUR", "de")).toBe("2k€");
  });
});
