import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import {
  DEBUG_FORCE_OFFLINE,
  MINIMUM_REQUIRED_SPEED,
} from "../confAppConstants";
import safeLogError from "./error";

const requiredSpeed = MINIMUM_REQUIRED_SPEED; // in Mbps

export interface ConnectionSpeedResult {
  isFastEnough: boolean;
  speed?: number; // download speed in Mbps
}

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

export async function isConnectionFastEnough(): Promise<ConnectionSpeedResult> {
  if (DEBUG_FORCE_OFFLINE) {
    return { isFastEnough: false };
  }
  const connectionInfo = await NetInfo.fetch();
  if (!connectionInfo.isConnected || !connectionInfo.isInternetReachable) {
    console.log("Not connected to the internet");
    return { isFastEnough: false };
  }
  const speed = await getConnectionSpeed();
  return {
    isFastEnough: speed >= requiredSpeed,
    speed: speed,
  };
}
