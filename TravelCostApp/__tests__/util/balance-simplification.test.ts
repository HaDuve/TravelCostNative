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

describe("Balance simplification: input order (#435/#436 follow-up)", () => {
  const aliceBob = { userName: "Alice", whoPaid: "Bob", amount: 10 };
  const bobCarol = { userName: "Bob", whoPaid: "Carol", amount: 10 };
  const amounts = (list: { amount: string | number }[]) =>
    list.map((s) => Number(s.amount));

  it("a chain of Balances simplifies to one payment when Alice->Bob is listed first", () => {
    const simplified = simplifySplits([aliceBob, bobCarol]);
    expect(amounts(simplified).filter((a) => a !== 0)).toHaveLength(1);
    expect(simplified).toHaveLength(1);
  });

  // Known bug (#446): the other order leaves a stray zero-amount Alice->Bob row.
  it.failing("gives the same result when Bob->Carol is listed first (no zero-amount rows)", () => {
    const simplified = simplifySplits([bobCarol, aliceBob]);
    expect(simplified.every((s) => Number(s.amount) !== 0)).toBe(true);
    expect(simplified).toHaveLength(1);
  });
});
