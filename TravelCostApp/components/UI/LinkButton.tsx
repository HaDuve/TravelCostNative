import { Linking } from "react-native";
import React from "react";
import GradientButton from "./GradientButton";
import PropTypes from "prop-types";
import safeLogError from "../../util/error";

const LinkingButton = ({ children, URL, style = {} }) => {
  const handleClick = () => {
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
