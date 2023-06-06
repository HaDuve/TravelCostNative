import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import { MINIMUM_REQUIRED_SPEED } from "../confAppConstants";

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
    console.log(error);
  }
}

export async function isConnectionFastEnough(): Promise<ConnectionSpeedResult> {
  const connectionInfo = await NetInfo.fetch();
  if (!connectionInfo.isConnected || !connectionInfo.isInternetReachable) {
    console.log("Not connected to the internet");
    return { isFastEnough: false };
  }
  return getConnectionSpeed().then((speed) => {
    // console.log("Connection speed:", speed.toFixed(2), "Mbps");
    return {
      isFastEnough: speed >= requiredSpeed,
      speed: speed,
    };
  });
}
