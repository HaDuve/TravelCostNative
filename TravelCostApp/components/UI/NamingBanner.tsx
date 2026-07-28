import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";

import ActionRow from "./ActionRow";
import ActionRowStack from "./ActionRowStack";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import { i18n } from "../../i18n/i18n";

type NamingBannerProps = {
  onNameIt: () => void;
  onLater: () => void;
};

function NamingBanner({ onNameIt, onLater }: NamingBannerProps) {
  return (
    <View testID="naming-banner" style={styles.container}>
      <Text style={styles.message}>{i18n.t("namingBannerText")}</Text>
      <ActionRowStack
        showChevron={false}
        actions={[
          {
            testID: "naming-banner-name-it",
            tier: "primary",
            label: i18n.t("namingBannerNameIt"),
            icon: "create-outline",
            onPress: onNameIt,
          },
          {
            testID: "naming-banner-later",
            tier: "secondary",
            label: i18n.t("later"),
            onPress: onLater,
          },
        ]}
      />
    </View>
  );
}

export default NamingBanner;

NamingBanner.propTypes = {
  onNameIt: PropTypes.func.isRequired,
  onLater: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: dynamicScale(12),
    marginBottom: dynamicScale(8, true),
    paddingHorizontal: dynamicScale(12),
    paddingVertical: dynamicScale(12, true),
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.primary50,
  },
  message: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(14, false, 0.5),
    textAlign: "center",
    marginBottom: dynamicScale(8, true),
  },
});
