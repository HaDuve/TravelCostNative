import { Linking } from "react-native";
import React from "react";
import GradientButton from "./GradientButton";
import PropTypes from "prop-types";
import safeLogError from "../../util/error";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

const LinkingButton = ({ children, URL, style = {} }) => {
  const handleClick = () => {
    // Track visit food for nomads if it's that URL
    if (URL === "https://foodfornomads.com/") {
      trackEvent(VexoEvents.VISIT_FOOD_FOR_NOMADS_PRESSED);
    }
    Linking.canOpenURL(URL).then((supported) => {
      if (supported) {
        Linking.openURL(URL);
      } else {
        safeLogError("Unsupported URL: " + URL);
      }
    });
  };
  return (
    <GradientButton onPress={handleClick} style={style}>
      {children}
    </GradientButton>
  );
};

export default LinkingButton;

LinkingButton.propTypes = {
  children: PropTypes.node.isRequired,
  URL: PropTypes.string.isRequired,
  style: PropTypes.object,
};
