import * as Device from "expo-device";

import { DEVELOPER_MODE } from "../confAppConstants";

const isProduction = !__DEV__;

export const shouldEnableVexo =
  isProduction && Device.isDevice && !DEVELOPER_MODE;

export enum VexoEventName {
  ERROR_OCCURRED = "error_occurred",
  USER_ACTION = "user_action",
  APP_EVENT = "app_event",
  PAYWALL_VIEWED = "paywall_viewed",
  GPT_RECOMMENDATION_USED = "gpt_recommendation_used",
  EXPENSE_DELETED = "expense_deleted",
  EXPENSE_EDITED = "expense_edited",
  EXPENSE_CREATED = "expense_created",
}

export enum VexoEvents {
  ERROR_OCCURRED = "error_occurred",
  USER_ACTION = "user_action",
  APP_EVENT = "app_event",
  PAYWALL_VIEWED = "paywall_viewed",
  GPT_RECOMMENDATION_USED = "gpt_recommendation_used",
  EXPENSE_DELETED = "expense_deleted",
  EXPENSE_EDITED = "expense_edited",
  EXPENSE_CREATED = "expense_created",
}
