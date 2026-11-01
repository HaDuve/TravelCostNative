import { getCurrencySymbol } from "../../util/currencySymbol";

describe("getCurrencySymbol", () => {
  it("returns symbol for known ISO codes", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("falls back to the first 3 chars for unknown string codes", () => {
    expect(getCurrencySymbol("ZZZ")).toBe("ZZZ");
    expect(getCurrencySymbol("ABCD")).toBe("ABC");
  });

  it("does not throw when currency is a non-string (whitescreen guard)", () => {
    expect(getCurrencySymbol(undefined as unknown as string)).toBe("");
    expect(getCurrencySymbol(null as unknown as string)).toBe("");
    expect(getCurrencySymbol(1 as unknown as string)).toBe("");
    expect(getCurrencySymbol(true as unknown as string)).toBe("");
    expect(getCurrencySymbol({ code: "EUR" } as unknown as string)).toBe("");
  });
});
