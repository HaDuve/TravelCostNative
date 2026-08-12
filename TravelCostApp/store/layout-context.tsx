import React, { createContext, useContext, useMemo } from "react";
import PropTypes from "prop-types";

import { useWindowSize } from "../components/Hooks/useWindowSize";
import { layoutFor, type LayoutProfile } from "../util/layout";

export const LayoutContext = createContext<LayoutProfile>(
  layoutFor({ width: 390, height: 844 })
);

const LayoutContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { width, height } = useWindowSize();
  const profile = useMemo(() => layoutFor({ width, height }), [width, height]);

  return (
    <LayoutContext.Provider value={profile}>{children}</LayoutContext.Provider>
  );
};

export function useLayoutProfile() {
  return useContext(LayoutContext);
}

export default LayoutContextProvider;

LayoutContextProvider.propTypes = {
  children: PropTypes.node,
};
