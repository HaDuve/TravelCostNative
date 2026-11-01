import { isCriticalOtaVersionMark } from "../../util/critical-ota-mark";

describe("isCriticalOtaVersionMark", () => {
  it("treats a trailing ! on the version segment as critical", () => {
    expect(isCriticalOtaVersionMark("1.3.005n!")).toBe(true);
  });

  it("does not treat an unmarked version as critical", () => {
    expect(isCriticalOtaVersionMark("1.3.005n")).toBe(false);
  });

  it("reads the version segment of an EAS update message", () => {
    expect(
      isCriticalOtaVersionMark(
        "1.3.005n!: Fix excessive data usage: stop repeated trip downloads for unnamed budgets"
      )
    ).toBe(true);
    expect(
      isCriticalOtaVersionMark(
        "1.3.005n: Fix excessive data usage: stop repeated trip downloads for unnamed budgets"
      )
    ).toBe(false);
  });
});
