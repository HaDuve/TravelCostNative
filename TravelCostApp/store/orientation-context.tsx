import React from "react";
import { createContext } from "react";
import PropTypes from "prop-types";

import { useWindowSize } from "../components/Hooks/useWindowSize";
import { useLayoutProfile } from "./layout-context";

export const OrientationContext = createContext({
  orientation: "PORTRAIT",
  isPortrait: true,
  isLandscape: false,
  isTablet: false,
  width: 0,
  height: 0,
});

const OrientationContextProvider = ({ children }) => {
  const layout = useLayoutProfile();
  const { width, height } = useWindowSize();
  const orientation = layout.orientation === "portrait" ? "PORTRAIT" : "LANDSCAPE";

  return (
    <OrientationContext.Provider
      value={{
        orientation,
        isPortrait: layout.orientation === "portrait",
        isLandscape: layout.orientation === "landscape",
        isTablet: layout.breakpoint !== "narrow",
        width,
        height,
      }}
    >
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationContextProvider;

OrientationContextProvider.propTypes = {
  children: PropTypes.node,
};
