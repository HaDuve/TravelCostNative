import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { toShortFormat } from "../../util/date";
import IconButton from "./IconButton";
import PropTypes from "prop-types";
import { moderateScale, scale, verticalScale } from "../../util/scalingUtil";

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
          size={moderateScale(32)}
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

DatePickerContainer.propTypes = {
  openDatePickerRange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  dateIsRanged: PropTypes.bool.isRequired,
  hideBottomBorder: PropTypes.bool,
  narrow: PropTypes.bool,
};

const styles = StyleSheet.create({
  dateIconContainer: {
    marginLeft: scale(7.5),
  },
  buttonContainer: {
    margin: scale(4),
    padding: scale(4),
    borderWidth: 1,

    borderColor: GlobalStyles.colors.gray700,
    borderRadius: moderateScale(5),
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

    marginHorizontal: scale(15),
    marginTop: verticalScale(12),
    paddingBottom: verticalScale(12),
  },
  advancedText: {
    marginTop: verticalScale(9),
    marginLeft: scale(12),
    fontSize: moderateScale(12),
    fontStyle: "italic",
    fontWeight: "300",
  },
  bottomBorder: {
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
  },
});
