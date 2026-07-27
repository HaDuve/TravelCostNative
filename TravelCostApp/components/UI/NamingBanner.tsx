import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";

import GradientButton from "./GradientButton";
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
      <View style={styles.actions}>
        <Pressable
          testID="naming-banner-later"
          onPress={onLater}
          style={({ pressed }) => [
            styles.laterButton,
            pressed && GlobalStyles.pressed,
          ]}
        >
          <Text style={styles.laterText}>{i18n.t("later")}</Text>
        </Pressable>
        <View testID="naming-banner-name-it" style={styles.nameItWrap}>
          <GradientButton
            onPress={onNameIt}
            style={styles.nameItButton}
            buttonStyle={styles.nameItButtonInner}
          >
            {i18n.t("namingBannerNameIt")}
          </GradientButton>
        </View>
      </View>
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  laterButton: {
    padding: dynamicScale(12),
  },
  laterText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(14, false, 0.5),
    textAlign: "center",
  },
  nameItWrap: {
    flex: 1,
    marginLeft: dynamicScale(8),
  },
  nameItButton: {
    alignSelf: "stretch",
  },
  nameItButtonInner: {
    paddingVertical: dynamicScale(10, true),
    paddingHorizontal: dynamicScale(12),
  },
});
