import React from "react";
import { createContext } from "react";
import PropTypes from "prop-types";
import { useOrientation } from "../components/Hooks/useOrientation";

export const OrientationContext = createContext({
  orientation: "PORTRAIT",
  isPortrait: true,
  isLandscape: false,
});

const OrientationContextProvider = ({ children }) => {
  const orientation = useOrientation();
  const isPortrait = orientation === "PORTRAIT";
  const isLandscape = orientation === "LANDSCAPE";

  return (
    <OrientationContext.Provider
      value={{ orientation, isPortrait, isLandscape }}
    >
      {children}
    </OrientationContext.Provider>
  );
};

export default OrientationContextProvider;

OrientationContextProvider.propTypes = {
  children: PropTypes.node,
};
