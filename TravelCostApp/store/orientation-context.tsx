import React from "react";
import { createContext } from "react";
import PropTypes from "prop-types";
import { useOrientation } from "../components/Hooks/useOrientation";
import { useWindowSize } from "../components/Hooks/useWindowSize";
import { isTablet as getIsTablet } from "../util/scalingUtil";

export const OrientationContext = createContext({
  orientation: "PORTRAIT",
  isPortrait: true,
  isLandscape: false,
  isTablet: false,
  width: 0,
  height: 0,
});

const OrientationContextProvider = ({ children }) => {
  const orientation = useOrientation();
  const { width, height } = useWindowSize();
  const isPortrait = orientation === "PORTRAIT";
  const isLandscape = orientation === "LANDSCAPE";
  const isTablet = getIsTablet();

  return (
    <OrientationContext.Provider
      value={{ orientation, isPortrait, isLandscape, isTablet, width, height }}
    >
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationContextProvider;

OrientationContextProvider.propTypes = {
  children: PropTypes.node,
};
