import { Text, TextProps, StyleSheet, Platform } from "react-native";
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
          lineHeight: fontSize,
          height: fontSize,
          textAlign: "center",
        },
        style,
        Platform.select({
          ios: {
            fontVariant: ["tabular-nums"],
            fontFamily: "SF Mono",
          },
          android: {
            fontFamily: "monospace",
            fontVariant: ["tabular-nums"],
          },
          default: {
            fontVariant: ["tabular-nums"],
          },
        }),
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: "bold",
    ...Platform.select({
      android: {
        textShadowColor: "rgba(0, 0, 0, 0.15)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
});

export default Tick;
