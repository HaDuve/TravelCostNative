import { StyleSheet, View } from "react-native";

import IconButton from "../UI/IconButton";
import { GlobalStyles } from "../../constants/styles";
import { constantScale, dynamicScale } from "../../util/scalingUtil";

type TripSwipeLeaveActionProps = {
  onPress: () => void;
};

function TripSwipeLeaveAction({ onPress }: TripSwipeLeaveActionProps) {
  return (
    <View testID="trip-swipe-leave-action" style={styles.container}>
      <IconButton
        icon="exit-outline"
        color={GlobalStyles.colors.backgroundColor}
        size={constantScale(36, 0.5)}
        onPress={onPress}
      />
    </View>
  );
}

export default TripSwipeLeaveAction;

const styles = StyleSheet.create({
  container: {
    marginBottom: dynamicScale(2, true, 0.5),
    alignItems: "center",
    justifyContent: "center",
    width: dynamicScale(56),
    backgroundColor: GlobalStyles.colors.error500,
  },
});
