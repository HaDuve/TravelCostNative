import React, { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { UserContext } from "../../store/user-context";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";

const AddExpenseButton = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const isOnline = userCtx.isOnline;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.addButton,
        pressed && GlobalStyles.pressedWithShadow,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("CategoryPick");
      }}
    >
      <Animated.View entering={FadeInDown.duration(600)}>
        <Ionicons name={"add-outline"} size={42} color={"white"} />
      </Animated.View>
    </Pressable>
  );
};

export default AddExpenseButton;

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 999,
    marginHorizontal: "40%",
    marginTop: "-100%",
    marginBottom: "1%",
    paddingVertical: "3.8%",
    paddingLeft: "0.8%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3.8,
  },
});
