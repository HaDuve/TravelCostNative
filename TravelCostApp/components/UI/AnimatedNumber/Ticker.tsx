import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import React, { useState } from "react";
import TickerDigit from "./TickerDigit";
import Tick from "./Tick";

interface TickerProps {
  value: number | string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Ticker component that displays an animated number with auto-sizing capabilities
 */
const Ticker: React.FC<TickerProps> = ({
  value,
  fontSize = 50,
  style,
  textStyle,
}) => {
  const [calculatedFontSize, setCalculatedFontSize] = useState(fontSize);

  // Keep digit strings as-is (e.g. "063") so leading zeros are not dropped
  const splitValue = String(value).split("");
  const displayValue = String(value);

  return (
    <View style={[styles.container, style]}>
      {/* Hidden text for font size calculation */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.hiddenText,
          {
            fontSize,
          },
        ]}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines[0]) {
            const ascender = e.nativeEvent.lines[0].ascender;
            if (ascender && ascender < fontSize) {
              setCalculatedFontSize(ascender);
            }
          }
        }}
      >
        {displayValue}
      </Text>

      {/* Visible animated digits */}
      <View style={styles.row}>
        {splitValue.map((char, index) => {
          const digit = parseInt(char, 10);
          return isNaN(digit) ? (
            // Render non-numeric characters (like decimal points) directly
            <Tick
              key={index}
              fontSize={calculatedFontSize}
              style={[styles.nonDigit, textStyle]}
            >
              {char}
            </Tick>
          ) : (
            // Render animated digits
            <TickerDigit
              key={index}
              value={digit}
              index={index}
              fontSize={calculatedFontSize}
              textStyle={textStyle}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    left: -9999,
  },
  nonDigit: {
    opacity: 0.5,
    textAlign: "center",
  },
});

export default Ticker;
