import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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

const IDLE_RESULT: OtaApplyResult = {
  available: false,
  updateReady: false,
  isCritical: false,
};

const CriticalOtaContext = createContext<CriticalOtaContextValue>({
  updateReady: false,
  isCritical: false,
  noteUpdateReady: () => {},
  requestCheckAndFetch: async () => IDLE_RESULT,
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
  const inFlightRef = useRef<Promise<OtaApplyResult> | null>(null);

  const noteUpdateReady = useCallback((result: OtaApplyResult) => {
    if (result.updateReady) {
      setUpdateReady(true);
      setIsCritical(result.isCritical);
    }
  }, []);

  const requestCheckAndFetch = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const pending = checkAndFetchOtaUpdate(client)
      .then((result) => {
        noteUpdateReady(result);
        return result;
      })
      .finally(() => {
        inFlightRef.current = null;
      });

    inFlightRef.current = pending;
    return pending;
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
