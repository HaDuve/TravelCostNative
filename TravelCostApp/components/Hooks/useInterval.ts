import { useEffect, useRef } from "react";

export const useInterval = (
  callback: (isCancelled: () => boolean) => void,
  interval: number,
  immediate: boolean
) => {
  const ref =
    useRef<(isCancelled: () => boolean) => void | undefined>(undefined);

  // keep reference to callback without restarting the interval
  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  useEffect(() => {
    // when this flag is set, closure is stale
    let cancelled = false;

    // wrap callback to pass isCancelled getter as an argument
    const fn = () => {
      ref.current?.(() => cancelled);
    };

    // set interval and run immediately if requested
    const id = setInterval(fn, interval);
    if (immediate) fn();

    // define cleanup logic that runs
    // when component is unmounting
    // or when or interval or immediate have changed
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [interval, immediate]);
};
