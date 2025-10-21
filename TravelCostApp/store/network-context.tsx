import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (DEBUG_FORCE_OFFLINE) {
        setIsConnected(false);
        return;
      }
      setIsConnected(state.isInternetReachable);
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
        const { isFastEnough, speed } = await isConnectionFastEnough();
        setLastConnectionSpeedInMbps(speed);
        setStrongConnection(isFastEnough);
      }
      asyncCheckConnectionSpeed();
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  return (
    <NetworkContext.Provider
      value={{ isConnected, strongConnection, lastConnectionSpeedInMbps }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContextProvider;

NetworkContextProvider.propTypes = {
  children: PropTypes.node,
};
