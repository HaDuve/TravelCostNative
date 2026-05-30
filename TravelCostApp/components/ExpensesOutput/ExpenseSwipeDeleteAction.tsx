import { StyleSheet, View } from "react-native";

import IconButton from "../UI/IconButton";
import { GlobalStyles } from "../../constants/styles";
import { constantScale, dynamicScale } from "../../util/scalingUtil";

type ExpenseSwipeDeleteActionProps = {
  onPress: () => void;
};

function ExpenseSwipeDeleteAction({ onPress }: ExpenseSwipeDeleteActionProps) {
  return (
    <View testID="expense-swipe-delete-action" style={styles.container}>
      <IconButton
        icon="trash"
        color={GlobalStyles.colors.backgroundColor}
        size={constantScale(36, 0.5)}
        onPress={onPress}
      />
    </View>
  );
}

export default ExpenseSwipeDeleteAction;

const styles = StyleSheet.create({
  container: {
    marginBottom: dynamicScale(2, true, 0.5),
    alignItems: "center",
    justifyContent: "center",
    width: dynamicScale(56),
    backgroundColor: GlobalStyles.colors.error500,
  },
});
