import { controlWidthStyle, layoutFor, usesLandscapeStatisticsRow } from "../../util/layout";

describe("controlWidthStyle", () => {
  it("stretches fill controls full width on narrow viewports", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    expect(controlWidthStyle(layout, "fill")).toEqual({
      alignSelf: "stretch",
      width: "100%",
      minHeight: 44,
      minWidth: 44,
    });
  });

  it("hugs back controls on narrow viewports without forcing full width", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    expect(controlWidthStyle(layout, "hug")).toEqual({
      alignSelf: "flex-start",
      minHeight: 44,
      minWidth: 44,
    });
  });

  it("centers fill controls with a max width on wide viewports", () => {
    const layout = layoutFor({ width: 1024, height: 768 });
    expect(controlWidthStyle(layout, "fill")).toEqual({
      alignSelf: "center",
      width: "100%",
      maxWidth: 480,
      minHeight: 44,
      minWidth: 44,
    });
  });

  it("hugs back controls with a max width on wide viewports", () => {
    const layout = layoutFor({ width: 1024, height: 768 });
    expect(controlWidthStyle(layout, "hug")).toEqual({
      alignSelf: "flex-start",
      maxWidth: 480,
      minHeight: 44,
      minWidth: 44,
    });
  });
});

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

describe("usesLandscapeStatisticsRow", () => {
  it("allows side-by-side chart and list only on narrow phone landscape", () => {
    const narrowLandscape = layoutFor({ width: 580, height: 360 });
    const phoneLandscape = layoutFor({ width: 844, height: 390 });
    const tabletLandscape = layoutFor({ width: 1194, height: 834 });

    expect(usesLandscapeStatisticsRow(narrowLandscape, false)).toBe(true);
    expect(usesLandscapeStatisticsRow(phoneLandscape, false)).toBe(false);
    expect(usesLandscapeStatisticsRow(tabletLandscape, false)).toBe(false);
  });
});
