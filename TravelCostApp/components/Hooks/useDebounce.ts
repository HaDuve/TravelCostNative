import { debounce } from "lodash";
import { useEffect, useMemo, useRef } from "react";

export const useDebounce = (callback: () => void) => {
  const ref = useRef<() => void | undefined>(undefined);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };

    return debounce(func, 1000);
  }, []);

  return debouncedCallback;
};

export const callDebounced = (func: (...args: any[]) => void, delay = 1000) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
