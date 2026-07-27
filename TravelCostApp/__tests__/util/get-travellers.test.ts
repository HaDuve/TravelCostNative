import * as http from "../../util/http";

jest.mock("../../util/error", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("getTravellers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an empty roster when the travellers fetch fails", async () => {
    jest
      .spyOn(http, "fetchTripsTravellers")
      .mockRejectedValueOnce(new Error("network"));

    await expect(http.getTravellers("trip-1")).resolves.toEqual([]);
  });
});
