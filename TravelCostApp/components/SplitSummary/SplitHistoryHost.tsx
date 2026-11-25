import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

import SplitHistoryModal from "./SplitHistoryModal";

export type SplitHistoryHostHandle = { open: () => void };

/**
 * Owns the history modal's visibility so opening it re-renders only the modal.
 * Keeping that flag in the Split Summary screen re-rendered the whole balances
 * list behind the modal, which stalled the JS thread right as it opened.
 */
const SplitHistoryHost = forwardRef<SplitHistoryHostHandle, { tripid: string }>(
  function SplitHistoryHost({ tripid }, ref) {
    const [visible, setVisible] = useState(false);
    useImperativeHandle(ref, () => ({ open: () => setVisible(true) }), []);
    const close = useCallback(() => setVisible(false), []);
    return (
      <SplitHistoryModal isVisible={visible} onClose={close} tripid={tripid} />
    );
  },
);

export default SplitHistoryHost;
