import { Share, View, Button } from "react-native";

const ShareTripButton = ({ route, navigation }) => {
  const shareId = route.params?.tripId;
  const onShare = async () => {
    const link = "exp://192.168.100.102:19000/--/join/" + shareId;
    try {
      const result = await Share.share({
        message:
          "Invite to trip: " + " You are welcome to join me on TripExpense!",
        url: link,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
    navigation.navigate("Profile");
  };
  return (
    <View style={{ marginTop: 50 }}>
      <Button onPress={onShare} title="Invite other Traveller" />
    </View>
  );
};

export default ShareTripButton;
