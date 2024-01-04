import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import {
  DEBUG_FORCE_OFFLINE,
  MINIMUM_REQUIRED_SPEED,
} from "../confAppConstants";
import safeLogError from "./error";

const requiredSpeed = MINIMUM_REQUIRED_SPEED; // in Mbps

export type ConnectionSpeedResult =
  | {
      isFastEnough: boolean;
      speed?: number; // download speed in Mbps
    }
  | boolean;

async function getConnectionSpeed(): Promise<number> {
  const downloadUrl = "https://jsonplaceholder.typicode.com/todos";
  const startTime = new Date().getTime();
  try {
    const response = await axios.get(downloadUrl, { responseType: "blob" });
    const endTime = new Date().getTime();
    if (endTime > startTime) {
      const fileSize = response.data.size;
      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsLoaded = fileSize * 8;
      const speedBps = bitsLoaded / durationInSeconds;
      const speedMbps = speedBps / 1000000;

      return speedMbps;
    } else {
      return 0;
    }
  } catch (error) {
    safeLogError(error);
    return 0;
  }
}

/**
 * Checks if the connection speed is fast enough.
 * @param returnBool - Optional parameter to indicate whether to return a boolean value instead of the ConnectionSpeedResult object.
 * @returns A Promise that resolves to a ConnectionSpeedResult object or a boolean value, depending on the value of returnBool.
 */
export async function isConnectionFastEnough(
  returnBool = false
): Promise<ConnectionSpeedResult> {
  if (DEBUG_FORCE_OFFLINE) {
    return { isFastEnough: false, speed: 0 };
  }
  const connectionInfo = await NetInfo.fetch();
  if (!connectionInfo.isConnected || !connectionInfo.isInternetReachable) {
    if (returnBool) return false;
    return { isFastEnough: false };
  }
  const speed = await getConnectionSpeed();
  if (returnBool) return speed >= requiredSpeed;
  return {
    isFastEnough: speed >= requiredSpeed,
    speed: speed,
  };
}
