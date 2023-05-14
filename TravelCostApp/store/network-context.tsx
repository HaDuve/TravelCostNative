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

export const NetworkContext = createContext({
  isConnected: true,
  strongConnection: true,
});

const NetworkContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(!DEBUG_FORCE_OFFLINE);
  const [strongConnection, setStrongConnection] = useState(false);

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
        const { isFastEnough } = await isConnectionFastEnough();
        setStrongConnection(isFastEnough);
      }
      asyncCheckConnectionSpeed();
    },
    DEBUG_POLLING_INTERVAL,
    true
  );

  return (
    <NetworkContext.Provider value={{ isConnected, strongConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContextProvider;

NetworkContextProvider.propTypes = {
  children: PropTypes.node,
};
