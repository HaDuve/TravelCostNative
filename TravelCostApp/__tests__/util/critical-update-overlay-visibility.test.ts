import {
  isSafeRouteForCriticalUpdateOverlay,
  shouldShowCriticalUpdateOverlay,
} from "../../util/critical-update-overlay-visibility";

describe("isSafeRouteForCriticalUpdateOverlay", () => {
  it("allows main bottom-tab and Settings routes", () => {
    expect(isSafeRouteForCriticalUpdateOverlay("RecentExpenses")).toBe(true);
    expect(isSafeRouteForCriticalUpdateOverlay("Overview")).toBe(true);
    expect(isSafeRouteForCriticalUpdateOverlay("Financial")).toBe(true);
    expect(isSafeRouteForCriticalUpdateOverlay("Profile")).toBe(true);
    expect(isSafeRouteForCriticalUpdateOverlay("Settings")).toBe(true);
    expect(isSafeRouteForCriticalUpdateOverlay("Finder")).toBe(true);
  });

  it("blocks modal and data-entry stack routes", () => {
    expect(isSafeRouteForCriticalUpdateOverlay("ManageExpense")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("ManageTrip")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("CategoryPick")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("ManageCategory")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("Join")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("Login")).toBe(false);
    expect(isSafeRouteForCriticalUpdateOverlay("Signup")).toBe(false);
  });
});

describe("shouldShowCriticalUpdateOverlay", () => {
  it("shows only when a critical update is ready on a safe route", () => {
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: true,
        isCritical: true,
        routeName: "RecentExpenses",
      })
    ).toBe(true);
  });

  it("defers while a form or other unsafe route is focused", () => {
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: true,
        isCritical: true,
        routeName: "ManageExpense",
      })
    ).toBe(false);
  });

  it("shows after leaving a form when the critical update is already ready", () => {
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: true,
        isCritical: true,
        routeName: "ManageExpense",
      })
    ).toBe(false);
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: true,
        isCritical: true,
        routeName: "Overview",
      })
    ).toBe(true);
  });

  it("never shows for non-critical or missing updates", () => {
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: true,
        isCritical: false,
        routeName: "RecentExpenses",
      })
    ).toBe(false);
    expect(
      shouldShowCriticalUpdateOverlay({
        updateReady: false,
        isCritical: true,
        routeName: "RecentExpenses",
      })
    ).toBe(false);
  });
});
