import { cancelDifferences } from "../../util/split";

const pair = (userName: string, whoPaid: string, amount: number) => ({
  userName,
  whoPaid,
  amount,
});

describe("Balance netting (cancelDifferences)", () => {
  it("nets opposite Balances of one pair into the larger direction, leaving other pairs untouched", () => {
    const result = cancelDifferences([
      pair("Carol", "Dave", 12),
      pair("Alice", "Bob", 50),
      pair("Dave", "Alice", 7),
      pair("Bob", "Alice", 30),
    ]);

    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        pair("Alice", "Bob", 20),
        pair("Carol", "Dave", 12),
        pair("Dave", "Alice", 7),
      ])
    );
  });

  it("gives the same result whichever direction is listed first", () => {
    const a = cancelDifferences([pair("Bob", "Alice", 30), pair("Alice", "Bob", 50)]);
    const b = cancelDifferences([pair("Alice", "Bob", 50), pair("Bob", "Alice", 30)]);
    expect(a).toEqual([pair("Alice", "Bob", 20)]);
    expect(b).toEqual([pair("Alice", "Bob", 20)]);
  });

  it("drops both directions when the amounts are equal", () => {
    expect(
      cancelDifferences([
        pair("Alice", "Bob", 25),
        pair("Bob", "Alice", 25),
        pair("Carol", "Alice", 5),
      ])
    ).toEqual([pair("Carol", "Alice", 5)]);
  });

  it("drops zero-amount Balances", () => {
    expect(
      cancelDifferences([pair("Alice", "Bob", 0), pair("Carol", "Dave", 4)])
    ).toEqual([pair("Carol", "Dave", 4)]);
  });

  it("rounds the net to cents", () => {
    expect(
      cancelDifferences([pair("Alice", "Bob", 10.1), pair("Bob", "Alice", 0.2)])
    ).toEqual([pair("Alice", "Bob", 9.9)]);
  });
});
