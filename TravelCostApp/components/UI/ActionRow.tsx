import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";

export type ActionRowTier = "primary" | "secondary" | "gradient";

export type ActionRowProps = {
  testID?: string;
  label: string;
  hint?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  imageIconSource?: ImageSourcePropType;
  tier?: ActionRowTier;
  onPress: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function ActionRow({
  testID,
  label,
  hint,
  icon,
  imageIconSource,
  tier = "secondary",
  onPress,
  showChevron = true,
  disabled = false,
  style,
}: ActionRowProps) {
  const isPrimary = tier === "primary";
  const isGradient = tier === "gradient";
  const showAccentStrip = isPrimary || isGradient;

  const onPressHandler = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPressHandler}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        styles.row,
        hint ? styles.rowWithHint : null,
        shadowRegressionStyles.actionRowCard,
        isPrimary && styles.rowPrimaryTint,
        disabled && styles.disabled,
        pressed && !disabled && ActionRowTokens.press,
        style,
      ]}
    >
      {showAccentStrip && (
        <LinearGradient
          colors={
            isGradient
              ? ActionRowTokens.gradients.promotional
              : ActionRowTokens.gradients.primary
          }
          style={styles.accentStrip}
        />
      )}
      <View style={[styles.iconSlot, hint ? styles.iconSlotWithHint : null]}>
        {imageIconSource ? (
          <Image source={imageIconSource} style={styles.imageIcon} />
        ) : icon ? (
          <Ionicons
            name={icon}
            size={ActionRowTokens.iconSize}
            color={GlobalStyles.colors.primary500}
          />
        ) : null}
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.label, isPrimary && styles.labelPrimary]}>
          {label}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {showChevron ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export default ActionRow;

ActionRow.propTypes = {
  testID: PropTypes.string,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  icon: PropTypes.string,
  imageIconSource: PropTypes.number,
  tier: PropTypes.oneOf(["primary", "secondary", "gradient"]),
  onPress: PropTypes.func.isRequired,
  showChevron: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: ActionRowTokens.borderRadius,
    padding: ActionRowTokens.padding,
    marginBottom: ActionRowTokens.marginBottom,
    overflow: "hidden",
  },
  rowWithHint: {
    alignItems: "flex-start",
  },
  rowPrimaryTint: {
    backgroundColor: ActionRowTokens.primaryTint,
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ActionRowTokens.accentStripWidth,
  },
  iconSlot: {
    marginRight: dynamicScale(12),
  },
  iconSlotWithHint: {
    marginTop: dynamicScale(1, true),
  },
  imageIcon: {
    width: ActionRowTokens.imageIconSize,
    height: ActionRowTokens.imageIconSize,
    borderRadius: 4,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: ActionRowTokens.labelFontSize,
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
  },
  labelPrimary: {
    color: GlobalStyles.colors.primary700,
  },
  hint: {
    fontSize: ActionRowTokens.hintFontSize,
    color: GlobalStyles.colors.textHidden,
    marginTop: dynamicScale(2, true),
    flexShrink: 1,
  },
  chevron: {
    fontSize: ActionRowTokens.chevronFontSize,
    color: GlobalStyles.colors.gray600,
  },
  disabled: {
    opacity: 0.5,
  },
});
