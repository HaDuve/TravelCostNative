import React, { useContext } from "react";
import {
  Alert,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { TripContext } from "../../store/trip-context";
import { useNavigation } from "@react-navigation/native";

interface LeaveDeleteTripButtonProps {
  tripid: string;
  tripName: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const LeaveDeleteTripButton: React.FC<LeaveDeleteTripButtonProps> = ({
  tripid,
  tripName,
  style,
  textStyle,
}) => {
  const tripCtx = useContext(TripContext);
  const navigation = useNavigation();
  const handleLeaveDeletePress = () => {
    Alert.alert(
      "Leave/Delete Trip",
      `Are you sure you want to leave or delete "${tripName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave/Delete",
          style: "destructive",
          onPress: () => {
            tripCtx.leaveOrDeleteTrip(tripid);
            navigation.goBack();
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleLeaveDeletePress}
    >
      <Text style={[styles.buttonText, textStyle]}>Leave/Delete Trip</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "black",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default LeaveDeleteTripButton;
