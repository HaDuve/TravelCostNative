import AsyncStorage from "@react-native-async-storage/async-storage";
import { DAYS_BEFORE_PROMPT } from "../../confAppConstants";

export const handleFirstStart = async () => {
  try {
    const firstStart = await AsyncStorage.getItem("firstStart");
    if (!firstStart) {
      // Set the current timestamp as the first start
      await AsyncStorage.setItem("firstStart", JSON.stringify(Date.now()));
    }
  } catch (error) {
    console.error("Error handling first start:", error);
  }
};

export const shouldPromptForRating = async () => {
  try {
    const neverAskAgain = await AsyncStorage.getItem("neverAskAgain");
    if (neverAskAgain) {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
  try {
    const firstStart = await AsyncStorage.getItem("firstStart");
    if (firstStart) {
      const remindLater = await AsyncStorage.getItem("remindLater");
      return remindLater
        ? comparePromptDates(remindLater)
        : comparePromptDates(firstStart);
    }
  } catch (error) {
    console.error("Error checking for rating prompt:", error);
  }
  return false;
};

const comparePromptDates = async (firstDate) => {
  const firstStartTimestamp = JSON.parse(firstDate);
  // normal time
  const daysInMilliseconds = DAYS_BEFORE_PROMPT * 24 * 60 * 60 * 1000;
  // debug shorter time
  // const daysInMilliseconds = 1 * 10 * 1000;
  const currentTime = Date.now();
  return currentTime - firstStartTimestamp >= daysInMilliseconds;
};
