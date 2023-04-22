import React, { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { createContext } from "react";
import PropTypes from "prop-types";

export const NetworkContext = createContext({
  isConnected: false,
});

const NetworkContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  console.log("NetworkProvider ~ isConnected:", isConnected);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
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
