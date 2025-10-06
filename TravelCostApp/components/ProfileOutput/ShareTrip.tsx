import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";
//Localization

import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Haptics from "expo-haptics";
import safeLogError from "../../util/error";
import { dynamicScale } from "../../util/scalingUtil";
import GradientButton from "../UI/GradientButton";
import IconButton from "../UI/IconButton";

export async function onShare(shareId, navigation) {
  // Branch.io removed - using simple fallback sharing
  let shareURL = i18n.t("inviteLink");

  // Simple fallback URL with trip ID
  shareURL = `${shareURL}?trip=${shareId}`;

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // const link = Linking.createURL("join/" + shareId);
  // const link = "exp://192.168.100.102:19000/--/join/" + shareId;
  // console.log("shareURL", shareURL);
  try {
    const result = await Share.share({
      message: i18n.t("inviteMessage"),
      url: shareURL,
    });
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    safeLogError(error);
    Alert.alert(i18n.t("errorShareTripText"), i18n.t("errorShareTripText"));
  }
  navigation.goBack();
}

const ShareTripButton = ({ route, navigation }) => {
  const shareId = route.params?.tripId;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-back-outline"
            size={24}
            color={GlobalStyles.colors.primary500}
            onPress={() => navigation.goBack()}
          />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={[GlobalStyles.titleText, styles.title]}>
            {i18n.t("inviteTraveller")}
          </Text>

          <Text style={[GlobalStyles.secondaryText, styles.description]}>
            {i18n.t("shareTripDescription")}
          </Text>

          <View style={styles.buttonContainer}>
            <GradientButton
              onPress={() => onShare(shareId, navigation)}
              style={styles.shareButton}
              buttonStyle={{}}
            >
              {i18n.t("inviteTraveller")}
            </GradientButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ShareTripButton;

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    marginBottom: dynamicScale(40, true),
  },
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: dynamicScale(20, false),
    paddingTop: dynamicScale(20, true),
  },
  description: {
    lineHeight: dynamicScale(20, true),
    marginBottom: dynamicScale(40, true),
    paddingHorizontal: dynamicScale(20, false),
    textAlign: "center",
  },
  header: {
    paddingBottom: dynamicScale(10, true),
    paddingHorizontal: dynamicScale(20, false),
    paddingTop: dynamicScale(20, true),
  },
  scrollContainer: {
    flexGrow: 1,
  },
  shareButton: {
    minWidth: dynamicScale(200, false),
    width: "80%",
  },
  title: {
    marginBottom: dynamicScale(20, true),
    textAlign: "center",
  },
});
