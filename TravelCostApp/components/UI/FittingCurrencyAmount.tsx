import React, { useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import * as Localization from "expo-localization";

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

export function resolveFittingLocale(locale?: string): string {
  if (locale) return locale;
  const device = Localization.getLocales()[0];
  return device?.languageTag || device?.languageCode || "en";
}

/**
 * Shared fit decision for currency amounts: measure full-form intrinsic width
 * via onTextLayout, compare to container onLayout, pick compact on overflow.
 */
export function useFittingCurrencyText(
  amount: number,
  currency: string,
  locale?: string
) {
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [fullWidth, setFullWidth] = useState<number | null>(null);

  const resolvedLocale = resolveFittingLocale(locale);

  const fullText = useMemo(
    () => formatExpenseWithCurrency(amount, currency, undefined, resolvedLocale),
    [amount, currency, resolvedLocale]
  );
  const compactText = useMemo(
    () => formatCompactExpenseWithCurrency(amount, currency, resolvedLocale),
    [amount, currency, resolvedLocale]
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

  function onFullProbeTextLayout(
    event: NativeSyntheticEvent<TextLayoutEventData>
  ) {
    const lineWidth = event.nativeEvent.lines[0]?.width;
    if (lineWidth != null) {
      setFullWidth(lineWidth);
    }
  }

  return {
    displayText,
    fullText,
    onContainerLayout,
    onFullProbeTextLayout,
  };
}

/**
 * Shows full currency formatting when it fits the container; otherwise
 * space-saving compact form. Full width is measured via a hidden probe
 * so the visible text never feeds back into the fit decision.
 */
export function FittingCurrencyAmount({
  amount,
  currency,
  locale,
  style,
  containerStyle,
  testID = "fitting-currency",
}: FittingCurrencyAmountProps) {
  const { displayText, fullText, onContainerLayout, onFullProbeTextLayout } =
    useFittingCurrencyText(amount, currency, locale);

  return (
    <View
      testID={testID}
      style={[styles.container, containerStyle]}
      onLayout={onContainerLayout}
    >
      <Text
        testID={`${testID}-full-probe`}
        style={[style, styles.fullProbe]}
        onTextLayout={onFullProbeTextLayout}
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
