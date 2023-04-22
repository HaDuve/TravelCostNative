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
import { TourGuideZone } from "rn-tourguide";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
import ToggleButton from "../../assets/SVG/toggleButton";
import PropTypes from "prop-types";
import { LinearGradient } from "expo-linear-gradient";
import { NetworkContext } from "../../store/network-context";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const AddExpenseButton = ({ navigation }) => {
  return (
    <Animated.View
      style={styles.margin}
      // entering={FadeIn.duration(600).delay(3000)}
    >
      <TourGuideZone
        text={i18n.t("walk2")}
        borderRadius={16}
        shape={"circle"}
        maskOffset={40}
        tooltipBottomOffset={80}
        zone={2}
      ></TourGuideZone>

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

AddExpenseButton.propTypes = {
  navigation: PropTypes.object.isRequired,
};

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
