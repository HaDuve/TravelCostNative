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
import { createRef, useContext, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { TourGuideZone } from "rn-tourguide";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { AuthContext } from "../../store/auth-context";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { reloadApp } from "../../util/appState";

const AddExpenseButton = ({ navigation }) => {
  const { settings } = useContext(SettingsContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const buttonRef = useRef(null);
  // if (buttonRef.current)
  //   console.log(
  //     "measureInWindow: ",
  //     buttonRef.current.measureInWindow((fx, fy, width, height, px, py) => {
  //       console.log("Component width is: " + width);
  //       console.log("Component height is: " + height);
  //       console.log("X offset to frame: " + fx);
  //       console.log("Y offset to frame: " + fy);
  //       console.log("X offset to page: " + px);
  //       console.log("Y offset to page: " + py);
  //     })
  //   );

  const [valid, setvalid] = useState(true);
  useEffect(() => {
    setvalid(
      tripCtx.tripid &&
        authCtx.uid &&
        tripCtx.travellers &&
        tripCtx.travellers.length > 0
    );
  }, [tripCtx.tripid, authCtx.uid, tripCtx.travellers]);
  console.log("AddExpenseButton ~ tripCtx.travellers:", tripCtx.travellers);
  console.log("AddExpenseButton ~ authCtx.uid:", authCtx.uid);
  console.log("AddExpenseButton ~ tripCtx.tripid:", tripCtx.tripid);
  const skipCatScreen = settings.skipCategoryScreen;
  if (!valid) {
    return (
      <Animated.View
        style={[styles.margin]}
        entering={FadeIn.duration(600).delay(8000)}
      >
        <Pressable
          onPress={() => {
            reloadApp();
          }}
          style={[
            styles.addButton,
            GlobalStyles.shadowGlowPrimary,
            styles.addButtonInactive,
          ]}
        >
          <LoadingBarOverlay
            containerStyle={{
              backgroundColor: "transparent",
              maxHeight: 44,
              marginLeft: -4,
            }}
            noText
          ></LoadingBarOverlay>
        </Pressable>
      </Animated.View>
    );
  }
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
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        ref={buttonRef}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          skipCatScreen &&
            navigation.navigate("ManageExpense", {
              pickedCat: "undefined",
            });
          !skipCatScreen && navigation.navigate("CategoryPick");
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
  },
  addButtonInactive: {
    backgroundColor: GlobalStyles.colors.primary800,
  },
});
