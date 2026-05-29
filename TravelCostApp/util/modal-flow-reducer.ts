import type { splitType } from "./split";

/** Matches ExpenseForm `setTimeout(…, 100)` between modal close and deferred reopen/effects. */
export const MODAL_FLOW_DEFER_MS = 100;

/** WHO_PAID picker sentinel; also used in ExpenseForm `onSelectItem`. */
export const MODAL_FLOW_ADD_TRAVELLER = "__ADD_TRAVELLER__" as const;

export const MODAL_FLOW_STATE = {
  CLOSED: "closed",
  WHO_PAID: "whoPaid",
  HOW_SHARED: "howShared",
  EXACT_SHARING: "exactSharing",
} as const;

export type ModalFlowState =
  (typeof MODAL_FLOW_STATE)[keyof typeof MODAL_FLOW_STATE];

/**
 * Work scheduled after `next` is applied. The UI interpreter should wait
 * {@link MODAL_FLOW_DEFER_MS} before applying `reopen` or `effects`.
 */
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

export type ModalFlowEffectHandlers = {
  setSplitType: (splitType: splitType) => void;
  runSplitHandler: (splitType: splitType) => void;
  openTravellerMultiPicker: () => void;
  navigateShare: () => void;
};

/** ExpenseForm interpreter: apply immediate effects from {@link modalFlowReducer}. */
export function applyModalFlowEffects(
  effects: ModalFlowEffect[],
  handlers: ModalFlowEffectHandlers
): void {
  for (const effect of effects) {
    switch (effect.type) {
      case "SET_SPLIT_TYPE":
        handlers.setSplitType(effect.splitType);
        break;
      case "RUN_SPLIT_HANDLER":
        handlers.runSplitHandler(effect.splitType);
        break;
      case "OPEN_TRAVELLER_MULTI_PICKER":
        handlers.openTravellerMultiPicker();
        break;
      case "NAVIGATE_SHARE":
        handlers.navigateShare();
        break;
    }
  }
}

const SPLIT_TYPE_EXACT = "EXACT";

export function modalFlowReducer(
  current: ModalFlowState,
  selectedValue: string
): ModalFlowResult {
  switch (current) {
    case MODAL_FLOW_STATE.WHO_PAID:
      if (selectedValue === MODAL_FLOW_ADD_TRAVELLER) {
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
