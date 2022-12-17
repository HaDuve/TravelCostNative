import { Share, View, Button } from "react-native";

export async function onShare(shareId, navigation) {
  const link = "exp://192.168.100.102:19000/--/join/" + shareId;
  try {
    const result = await Share.share({
      message: `Invite to trip: ${shareId}  You are welcome to join me on TripExpense!`,
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
}

const ShareTripButton = ({ route, navigation }) => {
  const shareId = route.params?.tripId;

  return (
    <View style={{ marginTop: 50 }}>
      <Button
        onPress={onShare.bind(this, shareId)}
        title="Invite other Traveller"
      />
    </View>
  );
};

export default ShareTripButton;
