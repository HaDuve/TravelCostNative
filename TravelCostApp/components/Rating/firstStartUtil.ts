import { DAYS_BEFORE_PROMPT, DEVELOPER_MODE } from "../../confAppConstants";
import {
  secureStoreGetObject,
  secureStoreSetObject,
} from "../../store/secure-storage";
import safeLogError from "../../util/error";
import { safelyParseJSON } from "../../util/jsonParse";

export const handleFirstStart = async () => {
  try {
    const firstStart = await secureStoreGetObject("firstStart");
    if (!firstStart) {
      // Set the current timestamp as the first start
      await secureStoreSetObject("firstStart", { value: Date.now() });
    }
  } catch (error) {
    console.error("Error handling first start:", error);
  }
};

export const shouldPromptForRating = async () => {
  if (DEVELOPER_MODE) {
    return true;
  }
  try {
    const neverAskAgain = await secureStoreGetObject("neverAskAgain");
    if (neverAskAgain?.value) {
      return false;
    }
  } catch (error) {
    safeLogError(error);
  }
  try {
    const firstStart = await secureStoreGetObject("firstStart");
    if (firstStart) {
      const remindLater = await secureStoreGetObject("remindLater");
      return remindLater
        ? isOlderThanOneDay(remindLater?.value)
        : isOlderThanOneDay(firstStart?.value);
    }
  } catch (error) {
    console.error("Error checking for rating prompt:", error);
  }
  return false;
};

export async function shouldShowOnboarding() {
  try {
    const firstStart = await secureStoreGetObject("firstStart");
    if (firstStart) {
      return !(await isOlderThanOneDay(firstStart?.value));
    }
    return true;
  } catch (error) {
    console.error("Error checking for rating prompt:", error);
    return false;
  }
}

const isOlderThanOneDay = async firstDate => {
  let firstStartTimestamp = Date.now();
  try {
    firstStartTimestamp = Number(safelyParseJSON(firstDate));
  } catch (error) {
    safeLogError(error);
  }
  // normal time is 24 Hours
  const daysInMilliseconds = DAYS_BEFORE_PROMPT * 24 * 60 * 60 * 1000;
  // debug shorter time
  // const daysInMilliseconds = 1 * 10 * 1000;
  const currentTime = Date.now();
  return currentTime - firstStartTimestamp >= daysInMilliseconds;
};
