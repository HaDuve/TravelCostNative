import { describeBalanceChanges } from "../../util/split-history-sentences";

const pair = [
  { userName: "Hannes", amount: 1.38 },
  { userName: "Tina", amount: -1.38 },
];

describe("describeBalanceChanges", () => {
  it("added: the one whose balance fell owes the other more", () => {
    expect(describeBalanceChanges("added", pair)).toEqual([
      {
        key: "splitHistoryOwesMore",
        debtor: "Tina",
        creditor: "Hannes",
        amount: 1.38,
      },
    ]);
  });

  it("deleted: the one whose balance rose owes the other less", () => {
    expect(
      describeBalanceChanges("deleted", [
        { userName: "Tina", amount: 1.38 },
        { userName: "Hannes", amount: -1.38 },
      ]),
    ).toEqual([
      {
        key: "splitHistoryOwesLess",
        debtor: "Tina",
        creditor: "Hannes",
        amount: 1.38,
      },
    ]);
  });

  it("one payer, several debtors: one sentence per debtor", () => {
    expect(
      describeBalanceChanges("added", [
        { userName: "Hannes", amount: 6 },
        { userName: "Tina", amount: -3 },
        { userName: "Marco", amount: -3 },
      ]),
    ).toEqual([
      {
        key: "splitHistoryOwesMore",
        debtor: "Tina",
        creditor: "Hannes",
        amount: 3,
      },
      {
        key: "splitHistoryOwesMore",
        debtor: "Marco",
        creditor: "Hannes",
        amount: 3,
      },
    ]);
  });

  it("several on both sides: states each person's own change", () => {
    const out = describeBalanceChanges("added", [
      { userName: "A", amount: 5 },
      { userName: "B", amount: 5 },
      { userName: "C", amount: -5 },
      { userName: "D", amount: -5 },
    ]);
    expect(out.map((s) => s.key)).toEqual([
      "splitHistoryOweMore",
      "splitHistoryOweMore",
      "splitHistoryOwedMore",
      "splitHistoryOwedMore",
    ]);
  });

  it("ignores zero changes", () => {
    expect(
      describeBalanceChanges("added", [{ userName: "A", amount: 0 }]),
    ).toEqual([]);
  });
});
