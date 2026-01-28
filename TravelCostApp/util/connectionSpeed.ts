import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import axios from "axios";
import {
  DEBUG_FORCE_OFFLINE,
  MINIMUM_REQUIRED_SPEED,
} from "../confAppConstants";
import safeLogError from "./error";

const requiredSpeed = MINIMUM_REQUIRED_SPEED; // in Mbps

export type ConnectionSpeedResult = {
  isFastEnough: boolean;
  speed?: number; // download speed in Mbps
};

type CachedConnectionSpeed = {
  value: ConnectionSpeedResult;
  expiresAtMs: number;
};

const CONNECTION_SPEED_CACHE_TTL_MS = 60_000;
const CONNECTION_SPEED_HARD_TIMEOUT_MS = 800;

let cachedResult: CachedConnectionSpeed | null = null;
let inFlightCheck: Promise<ConnectionSpeedResult> | null = null;

function nowMs(): number {
  return Date.now();
}

function getFreshCachedResult(): ConnectionSpeedResult | null {
  if (!cachedResult) return null;
  if (cachedResult.expiresAtMs <= nowMs()) return null;
  return cachedResult.value;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(onTimeout()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

/**
 * Checks if the connection speed is fast enough.
 * @param returnBool - Optional parameter to indicate whether to return a boolean value instead of the ConnectionSpeedResult object.
 * @returns A Promise that resolves to a ConnectionSpeedResult object or a boolean value, depending on the value of returnBool.
 */
export async function isConnectionFastEnough(): Promise<ConnectionSpeedResult> {
  if (DEBUG_FORCE_OFFLINE) {
    return { isFastEnough: false, speed: 0 };
  }

  const cached = getFreshCachedResult();
  if (cached) return cached;

  if (inFlightCheck) return inFlightCheck;

  inFlightCheck = (async () => {
    try {
      const connectionInfo = await withTimeout(
        NetInfo.fetch(),
        CONNECTION_SPEED_HARD_TIMEOUT_MS,
        () =>
          ({
            isConnected: true,
            isInternetReachable: null,
          }) as unknown as NetInfoState,
      );

      const isConnected = !!connectionInfo?.isConnected;
      // Reachability is often null on startup. Treat null as "unknown", not offline.
      const reachable = connectionInfo?.isInternetReachable;
      if (!isConnected || reachable === false) {
        const offlineResult = { isFastEnough: false, speed: 0 };
        cachedResult = {
          value: offlineResult,
          expiresAtMs: nowMs() + CONNECTION_SPEED_CACHE_TTL_MS,
        };
        return offlineResult;
      }

      const speed = await withTimeout(
        getConnectionSpeed(),
        CONNECTION_SPEED_HARD_TIMEOUT_MS,
        () => Number.NaN,
      );

      // If the speed check timed out (or errored) but we are connected, prefer
      // not forcing "offline-setup" during startup. We still cache briefly to
      // avoid repeated long checks.
      const result: ConnectionSpeedResult = Number.isFinite(speed)
        ? { isFastEnough: speed >= requiredSpeed, speed }
        : { isFastEnough: true };

      cachedResult = {
        value: result,
        expiresAtMs: nowMs() + CONNECTION_SPEED_CACHE_TTL_MS,
      };
      return result;
    } catch (error) {
      safeLogError(error);
      const fallback = { isFastEnough: false, speed: 0 };
      cachedResult = {
        value: fallback,
        expiresAtMs: nowMs() + CONNECTION_SPEED_CACHE_TTL_MS,
      };
      return fallback;
    } finally {
      inFlightCheck = null;
    }
  })();

  return inFlightCheck;
}

export async function isConnectionFastEnoughAsBool() {
  if (DEBUG_FORCE_OFFLINE) {
    return false;
  }
  const cached = getFreshCachedResult();
  if (cached) return cached.isFastEnough;

  const connectionInfo = await withTimeout(
    NetInfo.fetch(),
    CONNECTION_SPEED_HARD_TIMEOUT_MS,
    () =>
      ({
        isConnected: true,
        isInternetReachable: null,
      }) as unknown as NetInfoState,
  );
  const reachable = connectionInfo?.isInternetReachable;
  if (!connectionInfo.isConnected || reachable === false) {
    return false;
  }

  const speed = await withTimeout(
    getConnectionSpeed(),
    CONNECTION_SPEED_HARD_TIMEOUT_MS,
    () => Number.NaN,
  );
  if (!Number.isFinite(speed)) return true;
  return speed >= requiredSpeed;
}
