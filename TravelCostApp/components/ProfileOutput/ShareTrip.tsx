import React, { Share, View, Button, Alert } from "react-native";
import axios from "axios";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en');
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import safeLogError from "../../util/error";
import { loadKeys } from "../Premium/PremiumConstants";

export async function onShare(shareId, navigation) {
  const keys = await loadKeys();
  const branchKey = keys.BRAN;
  let shareURL = i18n.t("inviteLink");
  const getShareLinkData = {
    branch_key: branchKey,
    channel: "appinvite",
    campaign: "appinvite",
    tags: ["appinvite", shareId],
    $deeplink_path: `join/${shareId}`,
    data: {
      $deeplink_path: `join/${shareId}`,
    },
  };

  try {
    const response = await axios.post(
      "https://api2.branch.io/v1/url",
      getShareLinkData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Handle response data as needed
    const url = response.data.url;
    if (url) shareURL = url;
  } catch (error) {
    // Handle errors
    safeLogError(error);
    Alert.alert(i18n.t("errorShareTripText"), i18n.t("errorShareTripText"));
    return;
  }

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
  navigation.navigate("Profile");
}

const ShareTripButton = ({ route }) => {
  const shareId = route.params?.tripId;

  return (
    <View style={{ marginTop: 50 }}>
      <Button
        onPress={onShare.bind(this, shareId)}
        title={i18n.t("inviteTraveller")}
      />
    </View>
  );
};

export default ShareTripButton;

ShareTripButton.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};
