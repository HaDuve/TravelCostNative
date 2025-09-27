import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

interface MiniSyncIndicatorProps {
  isVisible: boolean;
  size?: number;
}

const MiniSyncIndicator: React.FC<MiniSyncIndicatorProps> = ({
  isVisible,
  size = 12,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {isVisible && (
        <ActivityIndicator size={size} color={GlobalStyles.colors.primary500} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: dynamicScale(12, false, 0.5),
  },
});

export default MiniSyncIndicator;
