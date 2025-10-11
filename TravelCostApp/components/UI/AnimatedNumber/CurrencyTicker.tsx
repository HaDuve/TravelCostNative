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
import {
  formatExpenseWithCurrency,
  truncateNumber,
} from "../../../util/string";

interface CurrencyTickerProps {
  value: number;
  currency: string;
  fontSize?: number;
  style?: StyleProp<TextStyle>;
  truncate?: boolean;
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
  truncate = true,
  truncateLimit = 1000,
  disableAnimation = false,
}) => {
  // Format the number with currency
  const formattedValue = useMemo(() => {
    const truncatedValue = truncate
      ? truncateNumber(value, truncateLimit, true)
      : value;
    return formatExpenseWithCurrency(truncatedValue, currency);
  }, [value, currency, truncate, truncateLimit]);

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

  // If animation is disabled, render simple Text with original styling
  if (disableAnimation) {
    return (
      <Text
        style={[
          {
            fontSize,
            fontWeight: "bold",
            ...Platform.select({
              android: {
                textShadowColor: "rgba(0, 0, 0, 0.15)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 8,
              },
            }),
          },
          style,
        ]}
      >
        {formattedValue}
      </Text>
    );
  }

  return (
    <View style={[styles.container, style]}>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  symbol: {
    opacity: 0.8,
    marginHorizontal: 1,
    fontWeight: "600",
  },
});

export default CurrencyTicker;
