import {
  StyleSheet,
  View,
  StyleProp,
  TextStyle,
  Text,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import React, { useMemo, useState } from "react";
import { Ticker, Tick } from "./index";
import {
  formatCompactExpenseWithCurrency,
  formatExpenseWithCurrency,
} from "../../../util/string";
import { pickFittingCurrencyText } from "../FittingCurrencyAmount";
import { i18n } from "../../../i18n/i18n";

interface CurrencyTickerProps {
  value: number;
  currency: string;
  fontSize?: number;
  style?: StyleProp<TextStyle>;
  /** @deprecated Fitting is layout-based; kept for call-site compat. */
  truncate?: boolean;
  /** @deprecated Unused; fitting uses container measure. */
  truncateLimit?: number;
  disableAnimation?: boolean;
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
}) => {
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [fullWidth, setFullWidth] = useState<number | null>(null);

  const fullText = useMemo(
    () => formatExpenseWithCurrency(value, currency),
    [value, currency]
  );
  const compactText = useMemo(
    () => formatCompactExpenseWithCurrency(value, currency, i18n.locale),
    [value, currency]
  );

  const formattedValue = pickFittingCurrencyText(
    fullText,
    compactText,
    fullWidth,
    containerWidth
  );

  // Split the formatted value into parts
  const parts = useMemo(() => {
    // More comprehensive regex to capture currency, number with formatting, and suffix
    const matches = formattedValue.match(/([^\d]*)([\d,.]*)([^\d]*)/);
    if (!matches) return { prefix: "", number: value, suffix: "" };

    // Extract the numeric part and clean it up
    const numberStr = matches[2] || "0";
    const cleanNumber = parseFloat(numberStr.replace(/,/g, "")) || 0;

    // Split the formatted number to preserve decimal point and commas
    const formattedNumber = numberStr.split(/([,.])/);

    return {
      prefix: matches[1] || "",
      number: cleanNumber,
      suffix: matches[3] || "",
      formattedNumber: formattedNumber,
    };
  }, [formattedValue, value]);

  function onContainerLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
  }

  function onFullProbeLayout(event: LayoutChangeEvent) {
    setFullWidth(event.nativeEvent.layout.width);
  }

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
        style={[styles.container, styles.stretch]}
        onLayout={onContainerLayout}
      >
        <Text
          style={[textStyle, styles.fullProbe]}
          onLayout={onFullProbeLayout}
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
      style={[styles.container, styles.stretch, style]}
      onLayout={onContainerLayout}
    >
      <Text
        style={[{ fontSize, fontWeight: "bold" }, styles.fullProbe]}
        onLayout={onFullProbeLayout}
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {fullText}
      </Text>
      <View style={styles.row}>
        {parts.prefix && (
          <Tick
            fontSize={fontSize * 0.8}
            style={[styles.symbol, { color: (style as any)?.color }]}
          >
            {parts.prefix}
          </Tick>
        )}
        {parts.formattedNumber.map((part, index) => {
          if (part === "," || part === ".") {
            return (
              <Tick
                key={index}
                fontSize={fontSize}
                style={[styles.symbol, { color: (style as any)?.color }]}
              >
                {part}
              </Tick>
            );
          }
          const num = parseFloat(part);
          if (!isNaN(num)) {
            return (
              <Ticker
                key={index}
                value={num}
                fontSize={fontSize}
                textStyle={{ color: (style as any)?.color }}
              />
            );
          }
          return null;
        })}
        {parts.suffix && (
          <Tick
            fontSize={fontSize * 0.8}
            style={[styles.symbol, { color: (style as any)?.color }]}
          >
            {parts.suffix}
          </Tick>
        )}
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
