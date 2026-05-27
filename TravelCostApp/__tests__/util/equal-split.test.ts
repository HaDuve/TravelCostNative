import { calcSplitList } from "../../util/split";

describe("Equal Split (calcSplitList)", () => {
  it("divides the expense amount equally among travellers on the Split", () => {
    const splits = calcSplitList("EQUAL", 100, "Alice", ["Alice", "Bob"]);

    expect(splits).toHaveLength(2);
    expect(splits).toEqual(
      expect.arrayContaining([
        { userName: "Alice", amount: 50 },
        { userName: "Bob", amount: 50 },
      ])
    );
    const total = splits!.reduce((sum, split) => sum + split.amount, 0);
    expect(total).toBe(100);
  });
});
