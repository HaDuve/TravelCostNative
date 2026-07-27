import {
  StyleSheet,
  View,
  StyleProp,
  TextStyle,
  Text,
  Platform,
} from "react-native";
import React, { useMemo } from "react";
import { Ticker, Tick } from "./index";
import { useFittingCurrencyText } from "../FittingCurrencyAmount";
import { i18n } from "../../../i18n/i18n";

interface CurrencyTickerProps {
  value: number;
  currency: string;
  fontSize?: number;
  style?: StyleProp<TextStyle>;
  disableAnimation?: boolean;
  testID?: string;
}

export type FormattedCurrencyParts = {
  prefix: string;
  tokens: string[];
  suffix: string;
};

/**
 * Split a localized currency display string into prefix, number tokens
 * (digit groups + separators), and suffix — without parseFloat so leading
 * zeros in groups like "063" / "06" stay intact.
 */
export function splitFormattedCurrencyParts(
  formattedValue: string
): FormattedCurrencyParts {
  const firstDigit = formattedValue.search(/\d/);
  if (firstDigit === -1) {
    return { prefix: formattedValue, tokens: [], suffix: "" };
  }

  let lastDigit = firstDigit;
  for (let i = firstDigit; i < formattedValue.length; i++) {
    if (/\d/.test(formattedValue[i])) {
      lastDigit = i;
    }
  }

  const prefix = formattedValue.slice(0, firstDigit);
  const numberStr = formattedValue.slice(firstDigit, lastDigit + 1);
  const suffix = formattedValue.slice(lastDigit + 1);
  const tokens = numberStr.split(/([^\d])/).filter((token) => token !== "");

  return { prefix, tokens, suffix };
}

/**
 * CurrencyTicker component that displays an animated number with currency formatting
 */
const CurrencyTicker: React.FC<CurrencyTickerProps> = ({
  value,
  currency,
  fontSize = 50,
  style,
  disableAnimation = false,
  testID = "currency-ticker",
}) => {
  const { displayText, fullText, onContainerLayout, onFullProbeTextLayout } =
    useFittingCurrencyText(value, currency, i18n.locale);

  const formattedValue = displayText;

  const parts = useMemo(
    () => splitFormattedCurrencyParts(formattedValue),
    [formattedValue]
  );

  const textStyle = [
    {
      fontSize,
      fontWeight: "bold" as const,
      ...Platform.select({
        android: {
          textShadowColor: "rgba(0, 0, 0, 0.15)",
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 8,
        },
      }),
    },
    style,
  ];

  // If animation is disabled, render simple Text with original styling
  if (disableAnimation) {
    return (
      <View
        testID={testID}
        style={[styles.container, styles.stretch]}
        onLayout={onContainerLayout}
      >
        <Text
          testID={`${testID}-full-probe`}
          style={[textStyle, styles.fullProbe]}
          onTextLayout={onFullProbeTextLayout}
          numberOfLines={1}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {fullText}
        </Text>
        <Text style={textStyle} numberOfLines={1}>
          {formattedValue}
        </Text>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.container, styles.stretch, style]}
      onLayout={onContainerLayout}
    >
      <Text
        testID={`${testID}-full-probe`}
        style={[{ fontSize, fontWeight: "bold" }, styles.fullProbe]}
        onTextLayout={onFullProbeTextLayout}
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {fullText}
      </Text>
      <View style={styles.row}>
        {parts.prefix ? (
          <Tick
            fontSize={fontSize * 0.8}
            style={[styles.symbol, { color: (style as TextStyle)?.color }]}
          >
            {parts.prefix}
          </Tick>
        ) : null}
        {parts.tokens.map((token, index) => {
          if (/^\d+$/.test(token)) {
            return (
              <Ticker
                key={index}
                value={token}
                fontSize={fontSize}
                textStyle={{ color: (style as TextStyle)?.color }}
              />
            );
          }
          return (
            <Tick
              key={index}
              fontSize={fontSize}
              style={[styles.symbol, { color: (style as TextStyle)?.color }]}
            >
              {token}
            </Tick>
          );
        })}
        {parts.suffix ? (
          <Tick
            fontSize={fontSize * 0.8}
            style={[styles.symbol, { color: (style as TextStyle)?.color }]}
          >
            {parts.suffix}
          </Tick>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  stretch: {
    alignSelf: "stretch",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: {
    opacity: 0.8,
    marginHorizontal: 1,
    fontWeight: "600",
  },
  fullProbe: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
  },
});

export default CurrencyTicker;
