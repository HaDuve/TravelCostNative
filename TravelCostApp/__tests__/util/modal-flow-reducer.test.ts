import type { splitType } from "../../util/split";
import {
  MODAL_FLOW_STATE,
  type ModalFlowEffect,
  type ModalFlowResult,
  type ModalFlowState,
  modalFlowReducer,
} from "../../util/modal-flow-reducer";

type TransitionCase = {
  current: ModalFlowState;
  selectedValue: string;
  expected: ModalFlowResult;
};

const closedNoEffects: ModalFlowResult = {
  next: MODAL_FLOW_STATE.CLOSED,
  effects: [],
};

function splitTypeEffects(splitType: splitType): ModalFlowEffect[] {
  return [
    { type: "SET_SPLIT_TYPE", splitType },
    { type: "RUN_SPLIT_HANDLER", splitType },
  ];
}

const transitionTable: TransitionCase[] = [
  {
    current: MODAL_FLOW_STATE.CLOSED,
    selectedValue: "EQUAL",
    expected: closedNoEffects,
  },
  {
    current: MODAL_FLOW_STATE.WHO_PAID,
    selectedValue: "Alice",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      deferred: { reopen: MODAL_FLOW_STATE.HOW_SHARED },
      effects: [],
    },
  },
  {
    current: MODAL_FLOW_STATE.WHO_PAID,
    selectedValue: "__ADD_TRAVELLER__",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      effects: [{ type: "NAVIGATE_SHARE" }],
    },
  },
  {
    current: MODAL_FLOW_STATE.HOW_SHARED,
    selectedValue: "EXACT",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      deferred: { reopen: MODAL_FLOW_STATE.EXACT_SHARING },
      effects: [],
    },
  },
  {
    current: MODAL_FLOW_STATE.HOW_SHARED,
    selectedValue: "EQUAL",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      effects: splitTypeEffects("EQUAL"),
    },
  },
  {
    current: MODAL_FLOW_STATE.HOW_SHARED,
    selectedValue: "SELF",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      effects: splitTypeEffects("SELF"),
    },
  },
  {
    current: MODAL_FLOW_STATE.EXACT_SHARING,
    selectedValue: "ignored",
    expected: {
      next: MODAL_FLOW_STATE.CLOSED,
      deferred: { effects: [{ type: "OPEN_TRAVELLER_MULTI_PICKER" }] },
      effects: [],
    },
  },
];

describe("modalFlowReducer transition table", () => {
  it.each(transitionTable)(
    "$current + $selectedValue → next/deferred/effects",
    ({ current, selectedValue, expected }) => {
      expect(modalFlowReducer(current, selectedValue)).toEqual(expected);
    }
  );
});
