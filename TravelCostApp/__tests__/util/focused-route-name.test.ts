import { getFocusedRouteName } from "../../util/focused-route-name";

describe("getFocusedRouteName", () => {
  it("returns the deepest focused route in a tab under a stack", () => {
    expect(
      getFocusedRouteName({
        index: 0,
        routes: [
          {
            name: "Home",
            state: {
              index: 1,
              routes: [{ name: "RecentExpenses" }, { name: "Overview" }],
            },
          },
        ],
      })
    ).toBe("Overview");
  });

  it("returns a modal stack route when it is focused", () => {
    expect(
      getFocusedRouteName({
        index: 1,
        routes: [
          {
            name: "Home",
            state: {
              index: 0,
              routes: [{ name: "RecentExpenses" }],
            },
          },
          { name: "ManageExpense" },
        ],
      })
    ).toBe("ManageExpense");
  });
});
