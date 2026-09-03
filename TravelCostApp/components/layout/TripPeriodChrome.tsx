import * as React from "react";
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import PropTypes from "prop-types";

import ExpensesSummary from "../ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { useLayoutProfile } from "../../store/layout-context";
import { tripPeriodLayoutTokens } from "../../styles/trip-period-layout-tokens";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";
import type { ExpenseData } from "../../util/expense";

// Accessibility constant: Allow period selector text to shrink to 70% of scaled size
// on devices with large font settings while maintaining legibility
const TEXT_MIN_FONT_SCALE = 0.7;

type PeriodItem = {
  label: string;
  value: string;
};

export type TripPeriodChromeProps = {
  tripLabel: string;
  syncSlot?: React.ReactNode;
  periodValue: string;
  periodItems: PeriodItem[];
  periodOpen: boolean;
  onPeriodOpenChange: (open: boolean) => void;
  onPeriodValueChange: (value: string | ((current: string) => string)) => void;
  onPeriodItemsChange: (items: PeriodItem[]) => void;
  expenses: ExpenseData[];
  summaryStyle?: StyleProp<ViewStyle>;
  showSummary?: boolean;
  onPeriodOpen?: () => void;
  onPeriodClose?: () => void;
  onPeriodSelectItem?: (item: PeriodItem | null) => void;
  periodModalProps?: object;
};

function TripPeriodChrome({
  tripLabel,
  syncSlot,
  periodValue,
  periodItems,
  periodOpen,
  onPeriodOpenChange,
  onPeriodValueChange,
  onPeriodItemsChange,
  expenses,
  summaryStyle,
  showSummary = true,
  onPeriodOpen,
  onPeriodClose,
  onPeriodSelectItem,
  periodModalProps,
}: TripPeriodChromeProps) {
  const layout = useLayoutProfile();
  const tokens = tripPeriodLayoutTokens(layout);
  const styles = React.useMemo(
    () => createStyles(tokens.periodHeaderLabelFontSize),
    [tokens.periodHeaderLabelFontSize]
  );

  return (
    <>
      <View testID="period-date-header" style={tokens.periodDateHeader}>
        <View style={styles.dateHeaderContent}>
          <Text style={styles.dateString}>{tripLabel}</Text>
          {syncSlot}
        </View>
      </View>

      <View testID="period-header-row" style={tokens.periodHeaderRow}>
        <DropDownPicker
          open={periodOpen}
          value={periodValue}
          items={periodItems}
          showTickIcon={false}
          placeholder=""
          modalProps={periodModalProps}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={TEXT_MIN_FONT_SCALE}
          setOpen={(callback) => {
            const nextOpen =
              typeof callback === "function" ? callback(periodOpen) : callback;
            onPeriodOpenChange(nextOpen);
          }}
          onOpen={onPeriodOpen}
          onClose={onPeriodClose}
          onSelectItem={onPeriodSelectItem}
          setValue={onPeriodValueChange}
          setItems={onPeriodItemsChange}
          containerStyle={[
            styles.dropdownContainer,
            tokens.headerCard,
            { marginTop: tokens.dropdownContainer.marginTop },
          ]}
          dropDownContainerStyle={styles.dropdownContainerDropdown}
          itemProps={{
            style: {
              height: dynamicScale(50, false, 0.5),
              padding: dynamicScale(4, false, 0.5),
              marginLeft: dynamicScale(4),
            },
          }}
          style={styles.dropdown}
          textStyle={styles.dropdownTextStyle}
        />

        {showSummary ? (
          <ExpensesSummary
            expenses={expenses}
            periodName={periodValue}
            style={summaryStyle}
          />
        ) : null}
      </View>

      <View
        style={[shadowRegressionStyles.overviewDividerBar, tokens.dividerBar]}
      />
    </>
  );
}

function createStyles(periodHeaderLabelFontSize: number) {
  return StyleSheet.create({
    dateHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateString: {
      fontSize: dynamicScale(12, false, 0.5),
      fontStyle: "italic",
      color: GlobalStyles.colors.gray700,
    },
    dropdownContainer: {
      ...shadowRegressionStyles.overviewDropdownContainer,
    },
    dropdownContainerDropdown: {
      maxHeight: dynamicScale(600, true),
      ...shadowRegressionStyles.dropdownListContainer,
    },
    dropdown: {
      ...shadowRegressionStyles.overviewDropdownInner,
    },
    dropdownTextStyle: {
      fontSize:
        i18n.locale == "fr"
          ? dynamicScale(20, false, 0.5)
          : periodHeaderLabelFontSize,
      fontWeight: "bold",
    },
  });
}

TripPeriodChrome.propTypes = {
  tripLabel: PropTypes.string.isRequired,
  syncSlot: PropTypes.node,
  periodValue: PropTypes.string.isRequired,
  periodItems: PropTypes.array.isRequired,
  periodOpen: PropTypes.bool.isRequired,
  onPeriodOpenChange: PropTypes.func.isRequired,
  onPeriodValueChange: PropTypes.func.isRequired,
  onPeriodItemsChange: PropTypes.func.isRequired,
  expenses: PropTypes.array.isRequired,
  summaryStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  showSummary: PropTypes.bool,
  onPeriodOpen: PropTypes.func,
  onPeriodClose: PropTypes.func,
  onPeriodSelectItem: PropTypes.func,
  periodModalProps: PropTypes.object,
};

export default TripPeriodChrome;
