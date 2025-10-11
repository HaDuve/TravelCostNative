import { Text, TextProps, StyleSheet } from "react-native";
import React from "react";

interface TickProps extends TextProps {
  fontSize: number;
  children: React.ReactNode;
}

/**
 * Tick component for displaying individual numbers with consistent spacing
 */
const Tick: React.FC<TickProps> = ({ fontSize, style, children, ...rest }) => {
  return (
    <Text
      style={[
        styles.text,
        {
          fontSize,
          lineHeight: fontSize * 1.1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});

export default Tick;
