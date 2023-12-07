import React, { Alert, Pressable, StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { reloadApp } from "../../util/appState";

const AddExpenseButton = ({ navigation }) => {
  const { settings } = useContext(SettingsContext);
  const skipCatScreen = settings.skipCategoryScreen;
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const [valid, setvalid] = useState(false);
  const [tryAgain, setTryAgain] = useState(false);

  useEffect(() => {
    setvalid(
      tripCtx.tripid &&
        authCtx.uid &&
        tripCtx.travellers &&
        tripCtx.travellers?.length > 0
    );
  }, [tripCtx.tripid, authCtx.uid, tripCtx.travellers?.length]);

  const pressHandler = useCallback(async () => {
    if (!valid) {
      // error haptic
      if (!tryAgain) {
        setTryAgain(true);
        return;
      }
      setTryAgain(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(
        "Not ready yet!",
        "Please try again later, alternatively login again or restart the App",
        [
          // cancel button
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Restart",
            onPress: () => {
              reloadApp();
            },
          },
          {
            text: "Login",
            onPress: () => {
              authCtx.logout();
              reloadApp();
            },
          },
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      skipCatScreen &&
        navigation.navigate("ManageExpense", {
          pickedCat: "undefined",
        });
      !skipCatScreen && navigation.navigate("CategoryPick");
    }
  }, [skipCatScreen, tryAgain, valid]);

  useEffect(() => {
    if (!tryAgain) return;
    if (!valid) return;
    pressHandler();
  }, [pressHandler, tryAgain, valid]);

  // if (!valid) {
  //   return (
  //     <Animated.View style={[styles.margin]} entering={FadeIn.duration(600)}>
  //       <Pressable
  //         onPress={() => {
  //           pressHandler();
  //         }}
  //         style={[
  //           styles.addButton,
  //           GlobalStyles.shadowGlowPrimary,
  //           styles.addButtonInactive,
  //         ]}
  //       >
  //         <LoadingBarOverlay
  //           containerStyle={{
  //             backgroundColor: "transparent",
  //             maxHeight: 44,
  //             marginLeft: -4,
  //           }}
  //           noText
  //         ></LoadingBarOverlay>
  //       </Pressable>
  //     </Animated.View>
  //   );
  // }
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
          // !valid && styles.addButtonInactive,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={pressHandler}
      >
        <Ionicons
          // name={valid ? "add-outline" : "alert"}
          name="add-outline"
          size={42}
          color={GlobalStyles.colors.backgroundColor}
        />
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
    backgroundColor: GlobalStyles.colors.primary400,
  },
});
