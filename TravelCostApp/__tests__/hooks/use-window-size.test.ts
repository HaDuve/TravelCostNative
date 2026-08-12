import { renderHook, act } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { useWindowSize } from "../../components/Hooks/useWindowSize";

describe("useWindowSize", () => {
  const listeners: Array<(event: { window?: { width: number; height: number } }) => void> =
    [];

  beforeEach(() => {
    listeners.length = 0;
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });
    jest.spyOn(Dimensions, "addEventListener").mockImplementation((_event, handler) => {
      listeners.push(handler as (event: {
        window?: { width: number; height: number };
      }) => void);
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ignores malformed dimension change events without throwing", () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current).toEqual({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(() => {
      act(() => {
        listeners.forEach((listener) => listener({}));
        listeners.forEach((listener) => listener({ window: undefined as never }));
      });
    }).not.toThrow();

    expect(result.current.width).toBe(390);
    expect(result.current.height).toBe(844);
  });

  it("updates when a valid dimension change event arrives", () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      listeners.forEach((listener) =>
        listener({ window: { width: 1024, height: 768 } })
      );
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it("removes the dimension listener on unmount", () => {
    const remove = jest.fn();
    jest.spyOn(Dimensions, "addEventListener").mockReturnValue({ remove });

    const { unmount } = renderHook(() => useWindowSize());
    unmount();

    expect(remove).toHaveBeenCalled();
  });
});
