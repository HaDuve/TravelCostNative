import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

const prefix = "cache";
const expiryInMinutes = 5;

const store = async (key, value) => {
  const item = {
    value,
    timeStamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(prefix + key, JSON.stringify(item));
  } catch (err) {
    console.log(err);
  }
};

const isExpired = (item) => {
  const now = moment(Date.now());
  const storedTime = moment(item.timeStamp);
  return now.diff(storedTime, "minutes") > expiryInMinutes;
};

const get = async (key) => {
  try {
    const value = await AsyncStorage.getItem(prefix + key);
    console.log("get ~ value:", value);
    const item = JSON.parse(value);

    if (!item) return null;

    if (isExpired(item)) {
      await AsyncStorage.removeItem(prefix + key);
      return null;
    }

    return item.value;
  } catch (err) {
    console.log(err);
  }
};

export default { store, get };
