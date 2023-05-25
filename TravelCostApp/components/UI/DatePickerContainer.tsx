import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { toShortFormat, getFormattedDate } from "../../util/date";
import IconButton from "./IconButton";
import PropTypes from "prop-types";

const DatePickerContainer = ({
  openDatePickerRange,
  startDate,
  endDate,
  dateIsRanged,
  narrow = false,
}) => {
  return (
    <View style={styles.dateContainer}>
      <View style={styles.dateIconContainer}>
        <IconButton
          icon={"calendar-outline"}
          size={32}
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
  narrow: PropTypes.bool,
};

const styles = StyleSheet.create({
  dateIconContainer: {
    marginLeft: "2.5%",
  },
  buttonContainer: {
    margin: 4,
    padding: 4,
    borderWidth: 1,

    borderColor: GlobalStyles.colors.gray700,
    borderRadius: 5,
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
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
    marginHorizontal: "5%",
    marginTop: "4%",
    paddingBottom: 4,
  },
  advancedText: {
    marginTop: 9,
    marginLeft: 12,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "300",
  },
});
