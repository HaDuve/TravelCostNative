import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import React from "react";
import { useGlobalStyles } from "../../store/theme-context";

import { i18n } from "../../i18n/i18n";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";

const LoadingOverlay = (props) => {
  const { containerStyle, customText, noText, size = "large" } = props;
  const GlobalStyles = useGlobalStyles();
  const loadingColor = GlobalStyles.colors.primaryGrayed;
  const styles = getStyles(GlobalStyles, loadingColor);
  const string =
    customText && customText?.length > 0
      ? customText
      : i18n.t("loadingYourTrip");
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={loadingColor} />
      {!noText && <Text style={styles.text}>{string}</Text>}
    </View>
  );
};

export default LoadingOverlay;

LoadingOverlay.propTypes = {
  containerStyle: PropTypes.object,
  customText: PropTypes.string,
  noText: PropTypes.bool,
  size: PropTypes.string,
};

const getStyles = (GlobalStyles, loadingColor) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: dynamicScale(12),
      marginTop: dynamicScale(4, true),
      backgroundColor: GlobalStyles.colors.backgroundColor,
    },
    text: {
      color: loadingColor,
      fontSize: dynamicScale(18, false, 0.5),
      fontWeight: "300",
      marginTop: dynamicScale(12, true),
    },
  });
