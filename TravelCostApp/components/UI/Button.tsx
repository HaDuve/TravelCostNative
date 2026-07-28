import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import PropTypes from "prop-types";

import { actionRowLabelFromChildren } from "../../util/action-row-label";
import ActionRow from "./ActionRow";

/**
 * @deprecated Use {@link ActionRow} directly instead.
 * Kept as a compatibility shim for legacy call sites; do not add new usages.
 */
const Button = ({
  children,
  onPress,
  mode = "",
  style = {},
  buttonStyle = {},
  hint,
  icon,
}: {
  children: React.ReactNode;
  onPress: () => void;
  mode?: string;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  hint?: string;
  icon?: React.ComponentProps<typeof ActionRow>["icon"];
}) => {
  const label = actionRowLabelFromChildren(children);
  const tier = mode === "flat" ? "secondary" : "primary";

  return (
    <ActionRow
      tier={tier}
      label={label}
      hint={hint}
      icon={icon}
      onPress={onPress}
      showChevron={false}
      style={[style, buttonStyle]}
    />
  );
};

export default Button;

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
  mode: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  buttonStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  hint: PropTypes.string,
  icon: PropTypes.string,
};
