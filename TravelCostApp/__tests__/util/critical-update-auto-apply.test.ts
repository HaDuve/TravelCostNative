import {
  isSafeRouteForCriticalUpdate,
  shouldAutoApplyCriticalUpdate,
} from "../../util/critical-update-auto-apply";

describe("isSafeRouteForCriticalUpdate", () => {
  it("allows main bottom-tab and Settings routes", () => {
    expect(isSafeRouteForCriticalUpdate("RecentExpenses")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Overview")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Financial")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Profile")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Settings")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Finder")).toBe(true);
    expect(isSafeRouteForCriticalUpdate("Home")).toBe(false);
  });

  it("blocks modal and data-entry stack routes", () => {
    expect(isSafeRouteForCriticalUpdate("ManageExpense")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("ManageTrip")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("CategoryPick")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("ManageCategory")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("Join")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("Login")).toBe(false);
    expect(isSafeRouteForCriticalUpdate("Signup")).toBe(false);
  });
});

describe("shouldAutoApplyCriticalUpdate", () => {
  it("shows only when a critical update is ready on a safe route", () => {
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: true,
        isCritical: true,
        routeName: "RecentExpenses",
      })
    ).toBe(true);
  });

  it("defers while a form or other unsafe route is focused", () => {
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: true,
        isCritical: true,
        routeName: "ManageExpense",
      })
    ).toBe(false);
  });

  it("shows after leaving a form when the critical update is already ready", () => {
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: true,
        isCritical: true,
        routeName: "ManageExpense",
      })
    ).toBe(false);
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: true,
        isCritical: true,
        routeName: "Overview",
      })
    ).toBe(true);
  });

  it("never shows for non-critical or missing updates", () => {
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: true,
        isCritical: false,
        routeName: "RecentExpenses",
      })
    ).toBe(false);
    expect(
      shouldAutoApplyCriticalUpdate({
        updateReady: false,
        isCritical: true,
        routeName: "RecentExpenses",
      })
    ).toBe(false);
  });
});
