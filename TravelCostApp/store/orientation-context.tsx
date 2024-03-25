import React from "react";
import { createContext } from "react";
import PropTypes from "prop-types";
import { useOrientation } from "../components/Hooks/useOrientation";
import { useWindowSize } from "../components/Hooks/useWindowSize";

export const OrientationContext = createContext({
  orientation: "PORTRAIT",
  isPortrait: true,
  isLandscape: false,
  width: 0,
  height: 0,
});

const OrientationContextProvider = ({ children }) => {
  const orientation = useOrientation();
  const { width, height } = useWindowSize();
  const isPortrait = orientation === "PORTRAIT";
  const isLandscape = orientation === "LANDSCAPE";

  return (
    <OrientationContext.Provider
      value={{ orientation, isPortrait, isLandscape, width, height }}
    >
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationContextProvider;

OrientationContextProvider.propTypes = {
  children: PropTypes.node,
};
