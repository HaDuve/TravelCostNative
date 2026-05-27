import { simplifySplits } from "../../util/split";

describe("Balance simplification (simplifySplits)", () => {
  it("reduces open Balance lines while preserving net amounts owed", () => {
    const openBalances = [
      { userName: "Bob", whoPaid: "Alice", amount: 50 },
      { userName: "Alice", whoPaid: "Bob", amount: 30 },
    ];

    const simplified = simplifySplits(openBalances);

    expect(simplified.length).toBeLessThan(openBalances.length);
    expect(simplified).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userName: "Bob",
          whoPaid: "Alice",
          amount: "20.00",
        }),
      ])
    );
  });
});
