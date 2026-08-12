import { ChartController } from "../../components/charts/controller";

describe("ChartController.getChartDimensions", () => {
  it("caps bar chart width at 600 on wide containers", () => {
    const dimensions = ChartController.getChartDimensions({
      kind: "bar",
      containerWidth: 1000,
      breakpoint: "wide",
      orientation: "landscape",
    });

    expect(dimensions.width).toBe(600);
    expect(dimensions.width).toBeLessThanOrEqual(600);
  });

  it("caps pie charts at 400 by 400", () => {
    const dimensions = ChartController.getChartDimensions({
      kind: "pie",
      containerWidth: 900,
      breakpoint: "wide",
      orientation: "landscape",
    });

    expect(dimensions.width).toBe(400);
    expect(dimensions.height).toBe(400);
  });

  it("uses the available container width when it is below the bar cap", () => {
    const dimensions = ChartController.getChartDimensions({
      kind: "bar",
      containerWidth: 320,
      breakpoint: "narrow",
      orientation: "portrait",
    });

    expect(dimensions.width).toBeLessThan(600);
    expect(dimensions.width).toBeGreaterThan(0);
  });

  it("never returns an unconstrained width", () => {
    const dimensions = ChartController.getChartDimensions({
      kind: "bar",
      containerWidth: 2000,
      breakpoint: "wide",
      orientation: "landscape",
    });

    expect(dimensions.width).toBeDefined();
    expect(Number.isFinite(dimensions.width)).toBe(true);
  });

  it("uses layout spacing tokens for chart padding", () => {
    const wide = ChartController.getChartDimensions({
      kind: "bar",
      containerWidth: 400,
      breakpoint: "wide",
      orientation: "landscape",
    });
    const narrow = ChartController.getChartDimensions({
      kind: "bar",
      containerWidth: 400,
      breakpoint: "narrow",
      orientation: "portrait",
    });

    expect(wide.paddingHorizontal).toBeGreaterThan(narrow.paddingHorizontal);
  });
});
