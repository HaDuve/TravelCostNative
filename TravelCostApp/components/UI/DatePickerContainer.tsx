import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { toShortFormat } from "../../util/date";
import IconButton from "./IconButton";
import PropTypes from "prop-types";

const DatePickerContainer = ({
  openDatePickerRange,
  startDate,
  endDate,
  dateIsRanged,
}) => {
  return (
    <View style={styles.dateContainer}>
      <View style={styles.dateIconContainer}>
        <IconButton
          icon={"calendar-outline"}
          size={32}
          color={GlobalStyles.colors.primary500}
          onPress={openDatePickerRange}
        />
      </View>
      <View style={{ flexDirection: "row" }}>
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
};

const styles = StyleSheet.create({
  dateIconContainer: {
    marginLeft: "2.5%",
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