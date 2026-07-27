import { splitFormattedCurrencyParts } from "../../components/UI/AnimatedNumber/CurrencyTicker";

describe("splitFormattedCurrencyParts", () => {
  it("keeps leading zeros in German thousand and fraction groups", () => {
    expect(splitFormattedCurrencyParts("1.063,06€")).toEqual({
      prefix: "",
      tokens: ["1", ".", "063", ",", "06"],
      suffix: "€",
    });
  });

  it("keeps French narrow-space thousand groups and suffix currency", () => {
    // Intl fr-FR uses U+202F (narrow no-break space) as the grouping separator
    expect(splitFormattedCurrencyParts("1\u202F063,06\u00A0€")).toEqual({
      prefix: "",
      tokens: ["1", "\u202F", "063", ",", "06"],
      suffix: "\u00A0€",
    });
  });

  it("keeps English prefix currency and comma thousands", () => {
    expect(splitFormattedCurrencyParts("€1,063.06")).toEqual({
      prefix: "€",
      tokens: ["1", ",", "063", ".", "06"],
      suffix: "",
    });
  });

  it("keeps Russian space thousand groups", () => {
    expect(splitFormattedCurrencyParts("1\u00A0063,06\u00A0€")).toEqual({
      prefix: "",
      tokens: ["1", "\u00A0", "063", ",", "06"],
      suffix: "\u00A0€",
    });
  });

  it("keeps compact German suffix after the number", () => {
    expect(splitFormattedCurrencyParts("1,3k€")).toEqual({
      prefix: "",
      tokens: ["1", ",", "3"],
      suffix: "k€",
    });
  });
});
