import { useEffect, useMemo, useRef } from "react";
import { debounce } from "lodash";
import PropTypes from "prop-types";

export const useDebounce = (callback) => {
  const ref = useRef();

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

useDebounce.propTypes = {
  callback: PropTypes.func.isRequired,
};
