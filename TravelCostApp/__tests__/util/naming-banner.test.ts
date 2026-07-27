import {
  dismissNamingBanner,
  dismissNamingBannerAfterFirstExpense,
  isNamingBannerDismissed,
  shouldShowNamingBanner,
} from "../../util/naming-banner";
import { MMKV_KEY_PATTERNS } from "../../store/mmkv-keys";

const mmkvStore: Record<string, string> = {};

jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn((key: string) => mmkvStore[key] ?? ""),
  setMMKVString: jest.fn((key: string, value: string) => {
    mmkvStore[key] = value;
  }),
}));

describe("naming banner (implicit default trip guidance)", () => {
  beforeEach(() => {
    Object.keys(mmkvStore).forEach((key) => delete mmkvStore[key]);
    jest.clearAllMocks();
  });

  describe("shouldShowNamingBanner", () => {
    it("shows for an undismissed implicit default trip", () => {
      expect(
        shouldShowNamingBanner({
          isImplicitDefault: true,
          isDismissed: false,
        })
      ).toBe(true);
    });

    it("hides when the Active trip is not an implicit default", () => {
      expect(
        shouldShowNamingBanner({
          isImplicitDefault: false,
          isDismissed: false,
        })
      ).toBe(false);
    });

    it("hides after permanent dismiss", () => {
      expect(
        shouldShowNamingBanner({
          isImplicitDefault: true,
          isDismissed: true,
        })
      ).toBe(false);
    });

    it("hides synchronously when the trip already has expenses", () => {
      expect(
        shouldShowNamingBanner({
          isImplicitDefault: true,
          isDismissed: false,
          expenseCount: 1,
        })
      ).toBe(false);
    });
  });

  describe("dismiss persistence", () => {
    it("Later permanently dismisses the banner for that trip", () => {
      const tripid = "t-implicit";
      expect(isNamingBannerDismissed(tripid)).toBe(false);

      dismissNamingBanner(tripid);

      expect(isNamingBannerDismissed(tripid)).toBe(true);
      expect(mmkvStore[MMKV_KEY_PATTERNS.NAMING_BANNER_DISMISSED(tripid)]).toBe(
        "1"
      );
    });

    it("does not treat another trip's dismiss as this trip's dismiss", () => {
      dismissNamingBanner("other-trip");
      expect(isNamingBannerDismissed("t-implicit")).toBe(false);
    });

    it("first expense on an implicit default trip dismisses permanently", () => {
      dismissNamingBannerAfterFirstExpense("t-implicit", 1, true);
      expect(isNamingBannerDismissed("t-implicit")).toBe(true);
    });

    it("zero expenses does not dismiss the naming banner", () => {
      dismissNamingBannerAfterFirstExpense("t-implicit", 0, true);
      expect(isNamingBannerDismissed("t-implicit")).toBe(false);
    });

    it("named trips do not auto-dismiss via expense count", () => {
      dismissNamingBannerAfterFirstExpense("t-named", 3, false);
      expect(isNamingBannerDismissed("t-named")).toBe(false);
    });
  });
});
