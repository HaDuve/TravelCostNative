import type { OnboardingFlags } from "../../types/onboarding";
import type { UserContextType } from "../../store/user-context";

describe("guided tour retirement (issue #353)", () => {
  it("OnboardingFlags no longer carries needsTour", () => {
    const flags: OnboardingFlags = { freshlyCreated: false };
    expect(flags).not.toHaveProperty("needsTour");
  });

  it("UserContextType no longer exposes needsTour / setNeedsTour", () => {
    type HasNeedsTour = UserContextType extends { needsTour: boolean }
      ? true
      : false;
    type HasSetNeedsTour = UserContextType extends {
      setNeedsTour: (bool: boolean) => void;
    }
      ? true
      : false;

    const hasNeedsTour: HasNeedsTour = false;
    const hasSetNeedsTour: HasSetNeedsTour = false;
    expect(hasNeedsTour).toBe(false);
    expect(hasSetNeedsTour).toBe(false);
  });

  it("tourUtil module is removed so leftover hadTour storage cannot trap Users", () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../util/tourUtil");
    }).toThrow();
  });
});
