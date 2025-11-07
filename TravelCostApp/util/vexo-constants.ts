export const VexoEvents = {
  // Expense Management
  EXPENSE_CREATED: "expense_created",
  EXPENSE_EDITED: "expense_edited",
  EXPENSE_DELETED: "expense_deleted",
  BULK_EXPENSE_ACTION: "bulk_expense_action",
  ADD_EXPENSE_BUTTON_PRESSED: "add_expense_button_pressed",
  ADD_EXPENSE_BUTTON_LONGPRESS: "add_expense_button_longpress",
  TEMPLATE_EXPENSE_SELECTED: "template_expense_selected",
  EXPENSE_CANCEL_PRESSED: "expense_cancel_pressed",
  GET_LOCAL_PRICE_PRESSED: "get_local_price_pressed",
  EXPENSE_PAID_TOGGLE_CHANGED: "expense_paid_toggle_changed",
  EXPENSE_SPECIAL_TOGGLE_CHANGED: "expense_special_toggle_changed",
  WHO_PAID_SELECTED: "who_paid_selected",
  SPLIT_TYPE_SELECTED: "split_type_selected",
  SPLITS_RECALCULATED: "splits_recalculated",
  QUICK_SUM_PRESSED: "quick_sum_pressed",
  ADVANCED_OPTIONS_TOGGLED: "advanced_options_toggled",
  CATEGORY_PICKED: "category_picked",
  CURRENCY_PICKED: "currency_picked",
  COUNTRY_PICKED: "country_picked",
  DATE_PICKED: "date_picked",
  DATE_RANGE_PICKED: "date_range_picked",

  // Trip Management
  TRIP_CREATED: "trip_created",
  TRIP_EDITED: "trip_edited",
  TRIP_JOINED: "trip_joined",
  TRIP_SHARED: "trip_shared",
  TRAVELER_ADDED: "traveler_added",
  TRIP_CANCEL_PRESSED: "trip_cancel_pressed",
  SET_ACTIVE_TRIP_PRESSED: "set_active_trip_pressed",
  TRIP_NAME_INPUT_CHANGED: "trip_name_input_changed",
  TOTAL_BUDGET_INPUT_CHANGED: "total_budget_input_changed",
  DAILY_BUDGET_INPUT_CHANGED: "daily_budget_input_changed",
  TRIP_CURRENCY_PICKED: "trip_currency_picked",
  TRIP_DATE_RANGE_PICKED: "trip_date_range_picked",
  DYNAMIC_DAILY_BUDGET_TOGGLED: "dynamic_daily_budget_toggled",

  // Financial Features
  SPLIT_CALCULATED: "split_calculated",
  PAYMENT_MARKED: "payment_marked",
  SETTLE_ALL_PRESSED: "settle_all_pressed",
  EXPORT_TRIGGERED: "export_triggered",
  SIMPLIFY_SPLITS_PRESSED: "simplify_splits_pressed",
  SPLIT_SUMMARY_BACK_PRESSED: "split_summary_back_pressed",
  OPEN_SPLITS_SUMMARY_PRESSED: "open_splits_summary_pressed",

  // Finder & Search
  FINDER_PRESSED: "finder_pressed",
  SEARCH_EXPENSES_INPUT_CHANGED: "search_expenses_input_changed",
  DATE_FILTER_TOGGLED: "date_filter_toggled",
  DATE_RANGE_SELECTOR_CHANGED: "date_range_selector_changed",
  CLEAR_SEARCH_PRESSED: "clear_search_pressed",
  SEARCH_QUERY_CHECKBOX_TOGGLED: "search_query_checkbox_toggled",

  // Overview & Charts
  GRAPH_CHART_VIEW_TOGGLED: "graph_chart_view_toggled",
  PERIOD_SELECTOR_CHANGED: "period_selector_changed",
  EXPENSES_REFRESHED: "expenses_refreshed",
  EXPENSE_ITEM_PRESSED: "expense_item_pressed",
  CATEGORY_CHART_TOGGLED: "category_chart_toggled",

  // Profile & Settings
  PROFILE_EDITED: "profile_edited",
  PROFILE_SAVED: "profile_saved",
  LOGOUT_PRESSED: "logout_pressed",
  DELETE_ACCOUNT_PRESSED: "delete_account_pressed",
  CREATE_TRIP_FROM_PROFILE_PRESSED: "create_trip_from_profile_pressed",
  VIEW_TRIP_SUMMARY_PRESSED: "view_trip_summary_pressed",
  TRIP_LIST_ITEM_PRESSED: "trip_list_item_pressed",
  SHOW_FLAGS_TOGGLE_CHANGED: "show_flags_toggle_changed",
  SHOW_WHO_PAID_TOGGLE_CHANGED: "show_who_paid_toggle_changed",
  ALWAYS_SHOW_ADVANCED_TOGGLE_CHANGED: "always_show_advanced_toggle_changed",
  SKIP_CATEGORY_SCREEN_TOGGLE_CHANGED: "skip_category_screen_toggle_changed",
  SHOW_INTERNET_SPEED_TOGGLE_CHANGED: "show_internet_speed_toggle_changed",
  HIDE_SPECIAL_EXPENSES_TOGGLE_CHANGED: "hide_special_expenses_toggle_changed",
  DISABLE_NUMBER_ANIMATIONS_TOGGLE_CHANGED:
    "disable_number_animations_toggle_changed",
  TRAFFIC_LIGHT_BUDGET_COLORS_TOGGLE_CHANGED:
    "traffic_light_budget_colors_toggle_changed",
  RESET_APP_INTRODUCTION_PRESSED: "reset_app_introduction_pressed",
  VISIT_FOOD_FOR_NOMADS_PRESSED: "visit_food_for_nomads_pressed",
  FEEDBACK_BUTTON_PRESSED: "feedback_button_pressed",

  // Premium & Monetization
  PAYWALL_VIEWED: "paywall_viewed",
  SUBSCRIPTION_STARTED: "subscription_started",
  TRIAL_STARTED: "trial_started",
  FEATURE_BLOCKED: "feature_blocked",
  PACKAGE_PURCHASED: "package_purchased",
  PACKAGE_MONTHLY_PURCHASED: "package_monthly_purchased",
  PACKAGE_YEARLY_PURCHASED: "package_yearly_purchased",
  PACKAGE_LIFETIME_PURCHASED: "package_lifetime_purchased",
  RESTORE_PURCHASES_PRESSED: "restore_purchases_pressed",
  VIEW_PAYWALL_PRESSED: "view_paywall_pressed",
  PREMIUM_BLUR_CARD_PRESSED: "premium_blur_card_pressed",
  CUSTOMER_SCREEN_PRESSED: "customer_screen_pressed",
  PAYWALL_BACK_PRESSED: "paywall_back_pressed",

  // AI & Smart Features
  GPT_RECOMMENDATION_USED: "gpt_recommendation_used",
  CATEGORY_SUGGESTION_ACCEPTED: "category_suggestion_accepted",
  SMART_CATEGORIZATION: "smart_categorization",
  GET_LOCAL_PRICE_PROFILE_PRESSED: "get_local_price_profile_pressed",

  // Account Management
  ACCOUNT_CREATED: "account_created",
  LOGIN_PRESSED: "login_pressed",
  SIGNUP_PRESSED: "signup_pressed",
  AUTH_MODE_SWITCHED: "auth_mode_switched",
  AUTH_FORM_SUBMITTED: "auth_form_submitted",

  // Category Management
  CATEGORY_CREATED: "category_created",
  CATEGORY_EDITED: "category_edited",
  CATEGORY_DELETED: "category_deleted",

  // Bulk Actions
  MULTI_SELECT_MODE_TOGGLED: "multi_select_mode_toggled",
  EXPENSE_SELECTED: "expense_selected",
  EXPENSE_DESELECTED: "expense_deselected",
  SELECT_ALL_EXPENSES_PRESSED: "select_all_expenses_pressed",
  DESELECT_ALL_EXPENSES_PRESSED: "deselect_all_expenses_pressed",
  DELETE_MULTIPLE_EXPENSES_PRESSED: "delete_multiple_expenses_pressed",
  MOVE_MULTIPLE_EXPENSES_PRESSED: "move_multiple_expenses_pressed",
  FILTERED_PIE_CHARTS_WITH_SELECTED_PRESSED:
    "filtered_pie_charts_with_selected_pressed",
  EDIT_MULTIPLE_EXPENSES_PRESSED: "edit_multiple_expenses_pressed",

  // Social/Sharing
  TRIP_INVITE_SENT: "trip_invite_sent",
  DEEP_LINK_OPENED: "deep_link_opened",
  REFERRAL_COMPLETED: "referral_completed",

  // Other Features
  ONBOARDING_TOUR_STARTED: "onboarding_tour_started",
  ONBOARDING_TOUR_SKIPPED: "onboarding_tour_skipped",
} as const;

export type VexoEventName = (typeof VexoEvents)[keyof typeof VexoEvents];
