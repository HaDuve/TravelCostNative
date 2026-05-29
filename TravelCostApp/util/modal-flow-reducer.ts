import type { splitType } from "./split";

export const MODAL_FLOW_STATE = {
  CLOSED: "closed",
  WHO_PAID: "whoPaid",
  HOW_SHARED: "howShared",
  EXACT_SHARING: "exactSharing",
} as const;

export type ModalFlowState =
  (typeof MODAL_FLOW_STATE)[keyof typeof MODAL_FLOW_STATE];

export type ModalFlowDeferred = {
  reopen?: ModalFlowState;
  effects?: ModalFlowEffect[];
};

export type ModalFlowEffect =
  | { type: "SET_SPLIT_TYPE"; splitType: splitType }
  | { type: "RUN_SPLIT_HANDLER"; splitType: splitType }
  | { type: "OPEN_TRAVELLER_MULTI_PICKER" }
  | { type: "NAVIGATE_SHARE" };

export type ModalFlowResult = {
  next: ModalFlowState;
  deferred?: ModalFlowDeferred;
  effects: ModalFlowEffect[];
};

const ADD_TRAVELLER_VALUE = "__ADD_TRAVELLER__";
const SPLIT_TYPE_EXACT = "EXACT";

export function modalFlowReducer(
  current: ModalFlowState,
  selectedValue: string
): ModalFlowResult {
  switch (current) {
    case MODAL_FLOW_STATE.WHO_PAID:
      if (selectedValue === ADD_TRAVELLER_VALUE) {
        return {
          next: MODAL_FLOW_STATE.CLOSED,
          effects: [{ type: "NAVIGATE_SHARE" }],
        };
      }
      return {
        next: MODAL_FLOW_STATE.CLOSED,
        deferred: { reopen: MODAL_FLOW_STATE.HOW_SHARED },
        effects: [],
      };

    case MODAL_FLOW_STATE.EXACT_SHARING:
      return {
        next: MODAL_FLOW_STATE.CLOSED,
        deferred: { effects: [{ type: "OPEN_TRAVELLER_MULTI_PICKER" }] },
        effects: [],
      };

    case MODAL_FLOW_STATE.HOW_SHARED:
      if (selectedValue === SPLIT_TYPE_EXACT) {
        return {
          next: MODAL_FLOW_STATE.CLOSED,
          deferred: { reopen: MODAL_FLOW_STATE.EXACT_SHARING },
          effects: [],
        };
      }
      return {
        next: MODAL_FLOW_STATE.CLOSED,
        effects: [
          { type: "SET_SPLIT_TYPE", splitType: selectedValue as splitType },
          {
            type: "RUN_SPLIT_HANDLER",
            splitType: selectedValue as splitType,
          },
        ],
      };

    default:
      return { next: MODAL_FLOW_STATE.CLOSED, effects: [] };
  }
}
