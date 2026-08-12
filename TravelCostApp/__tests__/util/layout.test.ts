import { layoutFor } from "../../util/layout";

describe("layoutFor", () => {
  it("maps a phone viewport to a narrow profile with 800 content max width", () => {
    const layout = layoutFor({ width: 390, height: 844 });

    expect(layout.breakpoint).toBe("narrow");
    expect(layout.contentMaxWidth).toBe(800);
  });

  it("maps live window width to narrow, medium, and wide breakpoints", () => {
    expect(layoutFor({ width: 599, height: 800 }).breakpoint).toBe("narrow");
    expect(layoutFor({ width: 600, height: 800 }).breakpoint).toBe("medium");
    expect(layoutFor({ width: 767, height: 800 }).breakpoint).toBe("medium");
    expect(layoutFor({ width: 768, height: 800 }).breakpoint).toBe("wide");
  });

  it("includes orientation from live width and height", () => {
    expect(layoutFor({ width: 390, height: 844 }).orientation).toBe("portrait");
    expect(layoutFor({ width: 1024, height: 768 }).orientation).toBe("landscape");
  });

  it("returns fixed spacing tokens that do not scale with viewport width", () => {
    const narrowPhone = layoutFor({ width: 320, height: 568 });
    const narrowTablet = layoutFor({ width: 599, height: 800 });

    expect(narrowPhone.space(1)).toBe(8);
    expect(narrowPhone.space(4)).toBe(20);
    expect(narrowTablet.space(4)).toBe(20);
  });

  it("uses slightly looser spacing tokens on wide breakpoints only", () => {
    const narrow = layoutFor({ width: 390, height: 844 });
    const wide = layoutFor({ width: 1024, height: 768 });

    expect(narrow.space(3)).toBe(16);
    expect(wide.space(3)).toBe(20);
  });

  it("caps typography scale for fonts and icons without affecting spacing", () => {
    const narrow = layoutFor({ width: 390, height: 844 });
    const medium = layoutFor({ width: 700, height: 900 });
    const wide = layoutFor({ width: 1024, height: 768 });

    expect(narrow.type(20)).toBe(20);
    expect(medium.type(20)).toBe(21);
    expect(wide.type(20)).toBe(24);
    expect(wide.space(3)).not.toBe(wide.type(16));
  });
});
