// asyncStorage, set to true if you want all storage to be reset and user logged out
export const DEBUG_RESET_STORAGE = false;
// OfflineMode, set to true if you want the simulator to be offline
export const DEBUG_FORCE_OFFLINE = false;
// no data, set to true if you want to load no data
export const DEBUG_NO_DATA = false;
// polling interval data
export const DEBUG_POLLING_INTERVAL = 5000;
// DEV const for testing and getting developer information
export const DEVELOPER_MODE = true;
// Premium consts
export const FORCE_PREMIUM = false;
// Rating/Review consts
export const DAYS_BEFORE_PROMPT = 2;
// Maximum number of period range days/months/years
export const MAX_PERIOD_RANGE = 33;
// Minimum number of period range days/months/years
export const MIN_PERIOD_RANGE = 3;
// toast tweaks
export const TOAST_LOCATION = "bottom";
// conservative maximum number for javascript not to crash
export const MAX_JS_NUMBER = 3435973836;
// tweak loading splash screen overlay delay
export const SPLASH_SCREEN_DELAY = 1500;
// tweak loading recent expenses overlay timeout
export const EXPENSES_LOAD_TIMEOUT = 2000;
// tweak minimum required internet speed in Mbit/s
export const MINIMUM_REQUIRED_SPEED = 0.1;
// cache: only call the exchange getRate request again after X numbers of hours
export const CACHE_NUM_HOURS = 1;
// maximum number of expenses before we start to show cheap text-based expenseItems
export const MAX_EXPENSES = 150;
