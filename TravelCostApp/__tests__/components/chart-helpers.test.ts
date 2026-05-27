import {
  createBarChartData,
  createPieChartData,
  formatDataForHighcharts,
} from "../../components/charts/chartHelpers";

describe("Highcharts column point payload", () => {
  it("createBarChartData omits originalData from points sent to the WebView", () => {
    const chartData = [
      {
        x: "2026-01-15",
        y: 42,
        color: "#00aa00",
        label: "15 Jan",
        originalData: {
          day: "2026-01-15",
          expensesSum: 42,
          dailyBudget: 50,
        },
      },
    ];

    const series = createBarChartData(chartData, {
      primary: "#111",
      error: "#f00",
      budget: "#999",
    }) as Array<{ data: Array<Record<string, unknown>> }>;

    const point = series[0].data[0];

    expect(point).toEqual({
      x: "2026-01-15",
      y: 42,
      color: "#00aa00",
      label: "15 Jan",
    });
    expect(point).not.toHaveProperty("originalData");
  });

  it("formatDataForHighcharts omits originalData and converts x when dateFormat is enabled", () => {
    const chartData = [
      {
        x: "2026-01-15",
        y: 10,
        color: "#00aa00",
        originalData: { expensesSum: 10 },
      },
    ];

    const series = formatDataForHighcharts(chartData, {
      dateFormat: true,
    }) as Array<{ data: Array<Record<string, unknown>> }>;

    const point = series[0].data[0];

    expect(point.x).toBe(new Date("2026-01-15").getTime());
    expect(point.y).toBe(10);
    expect(point.color).toBe("#00aa00");
    expect(point).not.toHaveProperty("originalData");
    expect(Object.keys(point).sort()).toEqual(["color", "x", "y"]);
  });
});

describe("Highcharts pie point payload", () => {
  it("createPieChartData omits originalData and only serializes name, y, and color", () => {
    const chartData = [
      {
        x: "Food 42 EUR",
        y: 42,
        color: "#ff0000",
        originalData: {
          categoryId: "food",
          expensesSum: 42,
        },
      },
    ];

    const series = createPieChartData(chartData) as Array<{
      data: Array<Record<string, unknown>>;
    }>;

    const point = series[0].data[0];

    expect(point).toEqual({
      name: 'Food<br/><span style="white-space: nowrap;">42 EUR</span>',
      y: 42,
      color: "#ff0000",
    });
    expect(point).not.toHaveProperty("originalData");
    expect(Object.keys(point).sort()).toEqual(["color", "name", "y"]);
  });
});
