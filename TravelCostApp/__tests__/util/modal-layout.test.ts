import { templatePickerModalContentWidth } from "../../util/modal-layout";

describe("templatePickerModalContentWidth", () => {
  it("subtracts horizontal inset from the screen width", () => {
    expect(templatePickerModalContentWidth(390, 6)).toBe(378);
  });

  it("never returns a negative width", () => {
    expect(templatePickerModalContentWidth(4, 6)).toBe(0);
  });

  it("never exceeds the screen width", () => {
    const screenWidth = 390;
    expect(templatePickerModalContentWidth(screenWidth)).toBeLessThanOrEqual(screenWidth);
  });
});
