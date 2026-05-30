import {
  normalizeTravellers,
  travellerUserNames,
} from "../../util/normalize-travellers";

describe("normalizeTravellers", () => {
  it("maps a name list to canonical Traveller roster entries", () => {
    expect(normalizeTravellers(["Alice", "Bob"])).toEqual([
      { uid: "", userName: "Alice" },
      { uid: "", userName: "Bob" },
    ]);
  });

  it("maps a Firebase travellers object to canonical roster entries", () => {
    expect(
      normalizeTravellers({
        keyA: { uid: "uid-a", userName: "Alice", touched: false },
        keyB: { uid: "uid-b", userName: "Bob", touched: true },
      })
    ).toEqual([
      { uid: "uid-a", userName: "Alice" },
      { uid: "uid-b", userName: "Bob" },
    ]);
  });
});

describe("travellerUserNames", () => {
  it("derives display names from canonical roster entries", () => {
    expect(
      travellerUserNames([
        { uid: "u1", userName: "Alice" },
        { uid: "u2", userName: "Bob" },
      ])
    ).toEqual(["Alice", "Bob"]);
  });
});
