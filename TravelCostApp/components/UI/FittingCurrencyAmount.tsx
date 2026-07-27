import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import {
  formatCompactExpenseWithCurrency,
  formatExpenseWithCurrency,
} from "../../util/string";

type FittingCurrencyAmountProps = {
  amount: number;
  currency: string;
  locale?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Chooses compact only after both widths are known and full text overflows. */
export function pickFittingCurrencyText(
  fullText: string,
  compactText: string,
  fullWidth: number | null,
  containerWidth: number | null
): string {
  if (containerWidth == null || fullWidth == null) return fullText;
  return fullWidth > containerWidth ? compactText : fullText;
}

/**
 * Shows full currency formatting when it fits the container; otherwise
 * space-saving compact form. Full width is measured via a hidden probe
 * so the visible text never feeds back into the fit decision.
 */
export function FittingCurrencyAmount({
  amount,
  currency,
  locale = "en",
  style,
  containerStyle,
  testID = "fitting-currency",
}: FittingCurrencyAmountProps) {
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [fullWidth, setFullWidth] = useState<number | null>(null);

  const fullText = useMemo(
    () => formatExpenseWithCurrency(amount, currency),
    [amount, currency]
  );
  const compactText = useMemo(
    () => formatCompactExpenseWithCurrency(amount, currency, locale),
    [amount, currency, locale]
  );

  const displayText = pickFittingCurrencyText(
    fullText,
    compactText,
    fullWidth,
    containerWidth
  );

  function onContainerLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
  }

  function onFullProbeLayout(event: LayoutChangeEvent) {
    setFullWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      testID={testID}
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      <Text
        testID={`${testID}-full-probe`}
        style={[style, styles.fullProbe]}
        onLayout={onFullProbeLayout}
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {fullText}
      </Text>
      <Text style={style} numberOfLines={1}>
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  fullProbe: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
  },
});
