import { StyleSheet, Text } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { NetworkContext } from "../../store/network-context";
import Animated, { ZoomInDown, ZoomOutDown } from "react-native-reanimated";
import { useGlobalStyles } from "../../store/theme-context";

import { i18n } from "../../i18n/i18n";

const ConnectionBar = () => {
  // show connection bar if listener detects change in internect connectivity

  const { isConnected } = useContext(NetworkContext);
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  const [isOnline, setIsOnline] = useState(isConnected);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    setIsOnline(isConnected);
  }, [isConnected]);

  useEffect(() => {
    if (!isOnline) {
      setShowBar(true);
      //   setTimeout(() => {
      //     setShowBar(false);
      //   }, 3000);
    }
  }, [isOnline]);

  if (!showBar) return null;
  return (
    <Animated.View
      entering={ZoomInDown.duration(800)}
      exiting={ZoomOutDown.duration(800)}
      style={styles.container}
    >
      <Text style={styles.offlineText}>{i18n.t("noInternetConnection")}</Text>
    </Animated.View>
  );
};

export default ConnectionBar;

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: GlobalStyles.colors.gray500,
      padding: 2,
      borderTopColor: GlobalStyles.colors.gray300,
    },
    offlineText: {
      color: GlobalStyles.colors.gray700,
      fontWeight: "300",
      fontSize: 12,
    },
  });
