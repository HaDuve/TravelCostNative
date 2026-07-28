import { useContext } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { UserContext } from "../../store/user-context";
import ActionRow from "../UI/ActionRow";
import { i18n } from "../../i18n/i18n";
import { dynamicScale } from "../../util/scalingUtil";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

type ProfileIdentityProps = {
  navigation: { navigate: (screen: string, params?: object) => void };
};

const ProfileIdentity = ({ navigation }: ProfileIdentityProps) => {
  const userCtx = useContext(UserContext);
  const freshlyCreated = userCtx.freshlyCreated;
  const userName = userCtx.userName ?? "";

  function joinInviteHandler() {
    trackEvent(VexoEvents.TRIP_JOINED);
    navigation.navigate("Join");
  }

  const freshlyNavigationButtons = freshlyCreated && (
    <View style={styles.navButtonContainer}>
      <ActionRow
        testID="profile-identity-join"
        tier="secondary"
        label={i18n.t("invitationText")}
        hint={i18n.t("joinBudgetHint")}
        icon="people-outline"
        onPress={joinInviteHandler}
      />
      <ActionRow
        testID="profile-identity-create"
        tier="primary"
        label={i18n.t("createFirstTrip")}
        hint={i18n.t("addAnotherBudgetHint")}
        icon="add-circle-outline"
        onPress={() => navigation.navigate("ManageTrip")}
      />
    </View>
  );

  return (
    <View style={styles.identity} testID="profile-identity">
      {freshlyCreated && (
        <View style={styles.welcomeTextBar}>
          <Text style={styles.welcomeText}>{`Welcome ${userName}!`}</Text>
        </View>
      )}
      <View style={styles.avatarBar}>
        <Pressable onPress={() => {}}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
          </View>
        </Pressable>
        <View style={styles.nameRow}>
          <Text style={styles.userText}>{userName}</Text>
        </View>
      </View>
      {freshlyNavigationButtons}
    </View>
  );
};

export default ProfileIdentity;

ProfileIdentity.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  identity: {
    paddingTop: dynamicScale(8, true),
    paddingBottom: dynamicScale(4, true),
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginLeft: dynamicScale(12, false, 0.5),
  },
  welcomeTextBar: {
    marginTop: dynamicScale(8, true),
    marginHorizontal: dynamicScale(15),
    padding: dynamicScale(4),
    minHeight: dynamicScale(50, true),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: dynamicScale(36, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  avatarBar: {
    marginTop: dynamicScale(4, true),
    marginHorizontal: dynamicScale(15),
    padding: dynamicScale(4),
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  avatar: {
    minHeight: dynamicScale(60, false, 0.5),
    minWidth: dynamicScale(60, false, 0.5),
    borderRadius: dynamicScale(60, false, 0.5),
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: dynamicScale(36, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  userText: {
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
  navButtonContainer: {
    paddingHorizontal: dynamicScale(15),
    marginTop: dynamicScale(8, true),
  },
});
