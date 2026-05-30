import React from "react";
import { View } from "react-native";
import { Checkbox } from "react-native-paper";
import IconButton from "../UI/IconButton";
import { GlobalStyles } from "../../constants/styles";
import { finderFilterRowStyles } from "../../styles/finder-filter-row-styles";
import { dynamicScale } from "../../util/scalingUtil";

type FinderFilterRowProps = {
  testID: string;
  rowStyle?: object;
  checked: boolean;
  onToggleChecked: () => void;
  showClear: boolean;
  onClear: () => void;
  children: React.ReactNode;
};

const FinderFilterRow = ({
  testID,
  rowStyle,
  checked,
  onToggleChecked,
  showClear,
  onClear,
  children,
}: FinderFilterRowProps) => {
  return (
    <View
      testID={testID}
      style={[finderFilterRowStyles.row, rowStyle]}
    >
      <View
        testID={`${testID}-checkbox`}
        style={finderFilterRowStyles.checkboxColumn}
      >
        <Checkbox status={checked ? "checked" : "unchecked"} onPress={onToggleChecked} />
      </View>
      <View
        testID={`${testID}-content`}
        style={finderFilterRowStyles.filterContentColumn}
      >
        {children}
      </View>
      <View
        testID={`${testID}-clear-slot`}
        style={finderFilterRowStyles.clearColumn}
      >
        {showClear ? (
          <IconButton
            icon="close-outline"
            size={dynamicScale(26, false, 0.5)}
            color={GlobalStyles.colors.textColor}
            onPressStyle={{
              backgroundColor: GlobalStyles.colors.gray500,
              borderRadius: 99,
            }}
            onPress={onClear}
          />
        ) : (
          <View style={finderFilterRowStyles.clearPlaceholder} />
        )}
      </View>
    </View>
  );
};

export default FinderFilterRow;
