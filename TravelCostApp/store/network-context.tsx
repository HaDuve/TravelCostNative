import React, { useMemo, useState, useEffect } from "react";
import {
  trackAsyncFunction,
  logRender,
} from "../util/performance";
import NetInfo from "@react-native-community/netinfo";
import { createContext } from "react";
import PropTypes from "prop-types";
import {
  DEBUG_FORCE_OFFLINE,
  DEBUG_POLLING_INTERVAL,
} from "../confAppConstants";
import { useInterval } from "../components/Hooks/useInterval";
import { isConnectionFastEnough } from "../util/connectionSpeed";

export type NetworkContextType = {
  isConnected: boolean;
  strongConnection: boolean;
  lastConnectionSpeedInMbps: number;
};

export const NetworkContext = createContext<NetworkContextType>({
  isConnected: false,
  strongConnection: false,
  lastConnectionSpeedInMbps: 0,
});

const NetworkContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(!DEBUG_FORCE_OFFLINE);
  const [strongConnection, setStrongConnection] = useState(false);
  const [lastConnectionSpeedInMbps, setLastConnectionSpeedInMbps] = useState(0);

  // Track renders
  React.useEffect(() => {
    logRender("NetworkContextProvider", "state changed", [
      "isConnected",
      "strongConnection",
    ]);
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (DEBUG_FORCE_OFFLINE) {
        setIsConnected((prev) => (prev ? false : prev));
        return;
      }
      // `isInternetReachable` is often null during startup. Treat null as
      // "unknown" and fall back to `isConnected` rather than forcing offline.
      const nextIsConnected =
        state.isInternetReachable === null
          ? !!state.isConnected
          : !!state.isInternetReachable;
      setIsConnected((prev) => (prev === nextIsConnected ? prev : nextIsConnected));
    });

    return () => unsubscribe();
  }, []);

  // intervall check if isConnected and fastConnection
  useInterval(
    () => {
      if (DEBUG_FORCE_OFFLINE) {
        setIsConnected(false);
        setStrongConnection(false);
        return;
      }
      async function asyncCheckConnectionSpeed() {
        const { isFastEnough, speed } = await trackAsyncFunction(
          isConnectionFastEnough,
          "isConnectionFastEnough",
          "background-polling"
        )();
        // Avoid cascading renders from "same value" updates
        setLastConnectionSpeedInMbps((prev) => {
          // Reduce churn from tiny measurement jitter
          const rounded = Number.isFinite(speed) ? Math.round(speed * 100) / 100 : 0;
          return prev === rounded ? prev : rounded;
        });
        setStrongConnection((prev) => (prev === isFastEnough ? prev : isFastEnough));
      }
      asyncCheckConnectionSpeed();
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  const value = useMemo(
    () => ({ isConnected, strongConnection, lastConnectionSpeedInMbps }),
    [isConnected, strongConnection, lastConnectionSpeedInMbps]
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContextProvider;

NetworkContextProvider.propTypes = {
  children: PropTypes.node,
};
