import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  checkAndFetchOtaUpdate,
  type OtaApplyResult,
} from "../util/check-and-fetch-ota-update";
import { createExpoOtaApplyClient } from "../util/ota-apply-client";

type CriticalOtaContextValue = {
  updateReady: boolean;
  isCritical: boolean;
  noteUpdateReady: (result: OtaApplyResult) => void;
  requestCheckAndFetch: () => Promise<OtaApplyResult>;
  applyReload: () => Promise<void>;
};

const CriticalOtaContext = createContext<CriticalOtaContextValue>({
  updateReady: false,
  isCritical: false,
  noteUpdateReady: () => {},
  requestCheckAndFetch: async () => ({
    available: false,
    updateReady: false,
    isCritical: false,
  }),
  applyReload: async () => {},
});

export function CriticalOtaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useMemo(() => createExpoOtaApplyClient(), []);
  const [updateReady, setUpdateReady] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const noteUpdateReady = useCallback((result: OtaApplyResult) => {
    if (result.updateReady) {
      setUpdateReady(true);
      setIsCritical(result.isCritical);
    }
  }, []);

  const requestCheckAndFetch = useCallback(async () => {
    const result = await checkAndFetchOtaUpdate(client);
    noteUpdateReady(result);
    return result;
  }, [client, noteUpdateReady]);

  const applyReload = useCallback(async () => {
    await client.reload();
  }, [client]);

  const value = useMemo(
    () => ({
      updateReady,
      isCritical,
      noteUpdateReady,
      requestCheckAndFetch,
      applyReload,
    }),
    [
      updateReady,
      isCritical,
      noteUpdateReady,
      requestCheckAndFetch,
      applyReload,
    ]
  );

  return (
    <CriticalOtaContext.Provider value={value}>
      {children}
    </CriticalOtaContext.Provider>
  );
}

export function useCriticalOta() {
  return useContext(CriticalOtaContext);
}
