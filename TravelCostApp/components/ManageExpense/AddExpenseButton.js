import React, { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { UserContext } from "../../store/user-context";
import { useContext } from "react";

const AddExpenseButton = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const isOnline = userCtx.isOnline;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        navigation.navigate("CategoryPick");
      }}
    >
      <Animated.View
        entering={FadeInDown.duration(600)}
        style={[
          styles.addButton,
          !isOnline && {
            borderWidth: 1,
            borderColor: GlobalStyles.colors.primary800,
          },
        ]}
      >
        <IconButton
          icon="add-outline"
          size={42}
          color={"white"}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("CategoryPick");
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

export default AddExpenseButton;

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 1,
    borderRadius: 999,
    marginHorizontal: "41.5%",
    marginTop: "-17%",
    paddingTop: "4.3%",
    paddingLeft: "1.0%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
