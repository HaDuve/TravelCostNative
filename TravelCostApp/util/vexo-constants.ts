export const VexoEvents = {
  // Expense Management
  EXPENSE_CREATED: "expense_created",
  EXPENSE_EDITED: "expense_edited",
  EXPENSE_DELETED: "expense_deleted",
  BULK_EXPENSE_ACTION: "bulk_expense_action",

  // Trip Management
  TRIP_CREATED: "trip_created",
  TRIP_JOINED: "trip_joined",
  TRIP_SHARED: "trip_shared",
  TRAVELER_ADDED: "traveler_added",

  // Financial Features
  SPLIT_CALCULATED: "split_calculated",
  PAYMENT_MARKED: "payment_marked",
  SETTLE_ALL_PRESSED: "settle_all_pressed",
  EXPORT_TRIGGERED: "export_triggered",

  // AI/Smart Features
  GPT_RECOMMENDATION_USED: "gpt_recommendation_used",
  CATEGORY_SUGGESTION_ACCEPTED: "category_suggestion_accepted",
  SMART_CATEGORIZATION: "smart_categorization",

  // Premium/Monetization
  PAYWALL_VIEWED: "paywall_viewed",
  SUBSCRIPTION_STARTED: "subscription_started",
  TRIAL_STARTED: "trial_started",
  FEATURE_BLOCKED: "feature_blocked",

  // Social/Sharing
  TRIP_INVITE_SENT: "trip_invite_sent",
  DEEP_LINK_OPENED: "deep_link_opened",
  REFERRAL_COMPLETED: "referral_completed",

  // Error Tracking
  ERROR_OCCURRED: "error_occurred",
} as const;

export type VexoEventName = (typeof VexoEvents)[keyof typeof VexoEvents];
