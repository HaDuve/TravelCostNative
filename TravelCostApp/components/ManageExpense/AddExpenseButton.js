import React, { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
  SlideInDown,
  SlideInUp,
} from "react-native-reanimated";
import { UserContext } from "../../store/user-context";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";

const AddExpenseButton = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const isOnline = userCtx.isOnline;
  return (
    <Animated.View
      style={styles.margin}
      entering={FadeIn.duration(600).delay(3000)}
    >
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
        <Ionicons name={"add-outline"} size={42} color={"white"} />
      </Pressable>
    </Animated.View>
  );
};

export default AddExpenseButton;

const styles = StyleSheet.create({
  margin: { marginTop: "-100%", marginHorizontal: "40%" },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 999,

    marginBottom: "10%",
    paddingVertical: "19.8%",
    paddingLeft: "5.5%",
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
