import React, { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { createContext } from "react";
import PropTypes from "prop-types";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";

export const NetworkContext = createContext({
  isConnected: false,
});

const NetworkContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(!DEBUG_FORCE_OFFLINE);

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

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContextProvider;

NetworkContextProvider.propTypes = {
  children: PropTypes.node,
};
