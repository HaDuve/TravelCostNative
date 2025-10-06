import { Pressable, StyleSheet, Text } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

const InfoButton = ({ containerStyle, onPress }) => {
  return (
    <Pressable
      style={[styles.container, GlobalStyles.strongShadow, containerStyle]}
      onPress={onPress}
    >
      <Text style={styles.text}>i</Text>
    </Pressable>
  );
};

export default InfoButton;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(50, false, 0.5),
    height: dynamicScale(20, false, 0.5),
    justifyContent: "center",
    width: dynamicScale(20, false, 0.5),
  },
  text: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "bold",
  },
});
