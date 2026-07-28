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
type FittingCurrencyPairDisplay = {
  spentText: string;
  budgetText: string;
};

/** Chooses compact for both spent and budget when the full pair overflows the row. */
export function pickFittingCurrencyPairDisplay(
  spent: number,
  budget: number,
  currency: string,
  locale: string,
  rowWidth: number | null,
  fullCombinedWidth: number | null,
  options?: { noBudget?: boolean }
): FittingCurrencyPairDisplay {
  const { noBudget = false } = options ?? {};
  const spentFull = formatExpenseWithCurrency(
    spent,
    currency,
    undefined,
    locale
  );
  const spentCompact = formatCompactExpenseWithCurrency(
    spent,
    currency,
    locale
  );
  const budgetFull = noBudget
    ? "∞"
    : formatExpenseWithCurrency(budget, currency, undefined, locale);
  const budgetCompact = noBudget
    ? "∞"
    : formatCompactExpenseWithCurrency(budget, currency, locale);

  const useCompact =
    rowWidth != null &&
    fullCombinedWidth != null &&
    fullCombinedWidth > rowWidth;

  return {
    spentText: useCompact ? spentCompact : spentFull,
    budgetText: useCompact ? budgetCompact : budgetFull,
  };
}

export function useFittingCurrencyPairText(
  spent: number,
  budget: number,
  currency: string,
  locale?: string,
  noBudget = false
) {
  const [rowWidth, setRowWidth] = useState<number | null>(null);
  const [fullCombinedWidth, setFullCombinedWidth] = useState<number | null>(
    null
  );

  const resolvedLocale = resolveFittingLocale(locale);

  const fullProbeText = useMemo(() => {
    const spentFull = formatExpenseWithCurrency(
      spent,
      currency,
      undefined,
      resolvedLocale
    );
    const budgetFull = noBudget
      ? "∞"
      : formatExpenseWithCurrency(budget, currency, undefined, resolvedLocale);
    return `${spentFull}/${budgetFull}`;
  }, [spent, budget, currency, resolvedLocale, noBudget]);

  const { spentText, budgetText } = pickFittingCurrencyPairDisplay(
    spent,
    budget,
    currency,
    resolvedLocale,
    rowWidth,
    fullCombinedWidth,
    { noBudget }
  );

  function onRowLayout(event: LayoutChangeEvent) {
    setRowWidth(event.nativeEvent.layout.width);
  }

  function onFullProbeTextLayout(
    event: NativeSyntheticEvent<TextLayoutEventData>
  ) {
    const lineWidth = event.nativeEvent.lines[0]?.width;
    if (lineWidth != null) {
      setFullCombinedWidth(lineWidth);
    }
  }

  return {
    spentText,
    budgetText,
    fullProbeText,
    onRowLayout,
    onFullProbeTextLayout,
  };
}

type FittingCurrencyAmountPairProps = {
  spent: number;
  budget: number;
  currency: string;
  locale?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  noBudget?: boolean;
  testID?: string;
};

/**
 * Shows full spent/budget formatting when the pair fits the row; otherwise
 * compact form for both amounts so neither side ellipsizes alone.
 */
export function FittingCurrencyAmountPair({
  spent,
  budget,
  currency,
  locale,
  textStyle,
  containerStyle,
  rowStyle,
  noBudget = false,
  testID = "fitting-currency-pair",
}: FittingCurrencyAmountPairProps) {
  const {
    spentText,
    budgetText,
    fullProbeText,
    onRowLayout,
    onFullProbeTextLayout,
  } = useFittingCurrencyPairText(spent, budget, currency, locale, noBudget);

  return (
    <View
      testID={testID}
      style={[styles.pairContainer, containerStyle]}
      onLayout={onRowLayout}
    >
      <Text
        testID={`${testID}-full-probe`}
        style={[textStyle, styles.fullProbe]}
        onTextLayout={onFullProbeTextLayout}
        numberOfLines={1}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {fullProbeText}
      </Text>
      <View style={[styles.pairRow, rowStyle]}>
        <Text style={textStyle} numberOfLines={1}>
          {spentText}
        </Text>
        <Text style={textStyle}>/</Text>
        <Text style={textStyle} numberOfLines={1}>
          {budgetText}
        </Text>
      </View>
    </View>
  );
}

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
  pairContainer: {
    width: "100%",
    overflow: "hidden",
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  fullProbe: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
  },
});
