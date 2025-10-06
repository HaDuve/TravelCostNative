import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { toShortFormat } from "../../util/date";
import { constantScale, dynamicScale } from "../../util/scalingUtil";

import IconButton from "./IconButton";

const DatePickerContainer = ({
  openDatePickerRange,
  startDate,
  endDate,
  dateIsRanged,
  hideBottomBorder = false,
  narrow = false,
}) => {
  return (
    <View
      style={[styles.dateContainer, !hideBottomBorder && styles.bottomBorder]}
    >
      <View style={styles.dateIconContainer}>
        <IconButton
          icon={"calendar-outline"}
          size={dynamicScale(32, false, 0.5)}
          color={GlobalStyles.colors.primary500}
          onPress={openDatePickerRange}
          buttonStyle={styles.buttonContainer}
        />
      </View>
      <View style={{ flexDirection: narrow ? "column" : "row" }}>
        <Text style={styles.advancedText}>
          {startDate && toShortFormat(new Date(startDate))}
        </Text>
        {dateIsRanged && (
          <Pressable onPress={openDatePickerRange}>
            <Text style={styles.advancedText}> - </Text>
          </Pressable>
        )}
        {dateIsRanged && (
          <Text style={styles.advancedText}>
            {endDate && toShortFormat(new Date(endDate))}
          </Text>
        )}
      </View>
    </View>
  );
};

export default DatePickerContainer;

const styles = StyleSheet.create({
  advancedText: {
    fontSize: dynamicScale(12, false, 0.5),
    fontStyle: "italic",
    fontWeight: "300",
    marginLeft: dynamicScale(12),
    marginTop: dynamicScale(9, true),
  },
  bottomBorder: {
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
  },
  buttonContainer: {
    margin: constantScale(4, 0.5),
    padding: constantScale(4, 0.5),
    borderWidth: 1,

    borderColor: GlobalStyles.colors.gray700,
    borderRadius: dynamicScale(5, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    // shadow
    elevation: 4,
    shadowColor: "#002A22",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 1.3,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: dynamicScale(4, false, 0.5),
    marginRight: dynamicScale(30, false, 0.5),
    marginTop: dynamicScale(12, true, 0.5),
    paddingBottom: dynamicScale(12, true, 0.5),
  },
  dateIconContainer: {
    marginLeft: constantScale(7.5, 0.5),
  },
});
