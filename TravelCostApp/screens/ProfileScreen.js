import { StyleSheet, Text, TextInput, View } from "react-native";
import { GlobalStyles } from "./../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <ProfileForm></ProfileForm>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: GlobalStyles.colors.primary800,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
});
