import { ReactNode } from "react";
import { ColorValue, ImageStyle, TextStyle, ViewStyle } from "react-native";

// Base Component Props
export interface BaseComponentProps {
  children?: ReactNode;
  style?:
    | ViewStyle
    | TextStyle
    | ImageStyle
    | (ViewStyle | TextStyle | ImageStyle)[];
}

// Button Component Props
export interface ButtonProps extends BaseComponentProps {
  onPress: () => void;
  buttonStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  darkText?: boolean;
  colors?: readonly ColorValue[];
  disabled?: boolean;
}

// Text Button Props
export interface TextButtonProps extends ButtonProps {
  children: string | ReactNode;
}

// Gradient Button Props
export interface GradientButtonProps extends ButtonProps {
  children: string | ReactNode;
  colors?: readonly ColorValue[];
}

// Link Button Props
export interface LinkButtonProps extends ButtonProps {
  children: string | ReactNode;
}

// Input Component Props
export interface InputProps {
  label: string;
  style?: ViewStyle;
  textInputConfig: {
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
    keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
    secureTextEntry?: boolean;
    placeholder?: string;
    editable?: boolean;
    selectTextOnFocus?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
  };
  invalid: boolean;
  autoFocus?: boolean;
  inputStyle?: ViewStyle | ViewStyle[];
  inputAccessoryViewID?: string;
  hasCurrency?: boolean;
}

// Toggle Component Props
export interface ToggleProps {
  style: ViewStyle;
  toggleState: () => void;
  state: boolean;
  label: string;
  labelStyle: TextStyle;
}

// Settings Section Props
export interface SettingsSectionProps {
  style: ViewStyle;
  toggleState: () => void;
  state: boolean;
  label: string;
  labelStyle: TextStyle;
}

// Icon Button Props
export interface IconButtonProps {
  icon: string;
  size: number;
  color: string;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: ViewStyle;
}

// Dropdown Component Props
export interface DropdownProps {
  value: string;
  label: string;
  data: any[];
  containerStyle: ViewStyle | ViewStyle[];
  onChange: (value: string) => void;
  placeholder: string;
  showOnEmpty: boolean;
  style?: ViewStyle;
  menuStyle?: ViewStyle;
}

// Autocomplete Props
export interface AutocompleteProps {
  value: string;
  label: string;
  data: any[];
  containerStyle: ViewStyle | ViewStyle[];
  onChange: (text: string) => void;
  showOnEmpty?: boolean;
  placeholder?: string;
  style?: ViewStyle | ViewStyle[];
  menuStyle?: ViewStyle | ViewStyle[];
  onTouchStart?: () => void;
}

// Toast Component Props
export interface ToastProps {
  children: ReactNode;
  style: ViewStyle | ViewStyle[];
  colors: ColorValue[];
}

// Tour Guide Tooltip Props
export interface TourGuideTooltipProps {
  children: string;
  onPress: () => void;
  textStyle: TextStyle;
}

// Chart Component Props
export interface ChartProps {
  cat: string;
  color: string;
  totalCost: number;
  catCost: number;
  iconOverride?: string;
  iconJSXOverride?: ReactNode;
}

// Category Data Props
export interface CategoryData {
  cat: string;
  color: string;
  totalCost: number;
  catCost: number;
  iconOverride?: string;
  iconJSXOverride?: ReactNode;
}

// Expense Statistics Props
export interface ExpenseStatisticsProps {
  inputData: CategoryData[];
  tripCurrency: string;
}

// Swipeable Props
export interface SwipeableProps {
  ref: (ref: any) => void;
  rightActions: ReactNode;
  children: ReactNode;
}

// Alert Button Props
export interface AlertButtonProps {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

// Date Picker Props
export interface DatePickerProps {
  onCancel: () => void;
  onSubmit: (date: Date) => void;
  date: Date;
  mode?: "date" | "time" | "datetime";
  isVisible: boolean;
}

// Currency Exchange Info Props
export interface CurrencyExchangeInfoProps {
  onPress: () => void;
  style?: ViewStyle;
}

// Add Expenses Here Button Props
export interface AddExpensesHereButtonProps {
  children: string;
  onPress: () => void;
  textStyle: TextStyle;
}

// Dev Content Props
export interface DevContentProps {
  style: ViewStyle;
}

// Category Pick Screen Props
export interface CategoryPickScreenProps {
  style: ViewStyle;
}

// Join Trip Props
export interface JoinTripProps {
  style: ViewStyle;
  value: string;
  onUpdateValue: (value: string) => void;
  label: string;
  secure: boolean;
  keyboardType: string;
  isInvalid: boolean;
  isInvalidInfoText?: string;
  textContentType?: string;
}

// Filtered Expenses Props
export interface FilteredExpensesProps {
  expenses: any[];
  fallbackText: string;
  refreshControl: ReactNode;
  refreshing: boolean;
  showSumForTravellerName: boolean;
  isFiltered: boolean;
}

// Filtered Pie Charts Props
export interface FilteredPieChartsProps {
  route: any;
  expensesAsArg: any;
  dayStringAsArg: any;
}

// Financial Screen Props
export interface FinancialScreenProps {
  cat: string;
  color: string;
  totalCost: number;
  catCost: number;
  iconOverride: string;
  iconJSXOverride: ReactNode;
}

// Finder Screen Props
export interface FinderScreenProps {
  value: string;
  onChange: (query: string) => void;
  data: any[];
  showOnEmpty: boolean;
  label: string;
  containerStyle: ViewStyle | ViewStyle[];
  style: ViewStyle;
  menuStyle: ViewStyle;
  placeholder: string;
}

// Manage Category Screen Props
export interface ManageCategoryScreenProps {
  children: string | ReactNode;
  onPress: () => void;
  textStyle: TextStyle;
  buttonStyle: ViewStyle;
  colors?: ColorValue[];
  darkText?: boolean;
}

// Recent Expenses Props
export interface RecentExpensesProps {
  expenses: any[];
  fallbackText: string;
  refreshing: boolean;
  refreshControl: ReactNode;
  showSumForTravellerName: boolean;
  isFiltered: boolean;
}

// Split Summary Screen Props
export interface SplitSummaryScreenProps {
  children: string;
  onPress: () => void;
  textStyle: TextStyle;
  buttonStyle: ViewStyle;
  style?: ViewStyle;
}

// Trip History Item Props
export interface TripHistoryItemProps {
  tripId: any;
  trips: any;
}

// Expense Form Props
export interface ExpenseFormProps {
  onCancel: () => void;
  onSubmit: (expenseData: any) => Promise<void>;
  submitButtonLabel: string;
  isEditing: boolean;
  defaultValues: any;
  pickedCat: string;
  navigation: any;
  editedExpenseId?: string;
  newCat?: string;
  iconName?: string;
  dateISO: string;
  setIsSubmitting?: (value: boolean) => void;
}

// Overview Screen Props
export interface OverviewScreenProps {
  periodName: any;
  periodRangeNumber: any;
  longerPeriodNum: any;
  setLongerPeriodNum: (value: any) => void;
  startingPoint: any;
  setStartingPoint: (value: any) => void;
  tripCtx: any;
  navigation: any;
  expenses?: any;
  forcePortraitFormat?: boolean;
}

// Expenses Overview Props
export interface ExpensesOverviewProps {
  expenses: any;
  periodName: any;
  navigation: any;
  forcePortraitFormat: boolean;
}

// Push Screen Props
export interface PushScreenProps {
  onPress: () => void;
  style?: ViewStyle;
}

// Rating Modal Props
export interface RatingModalProps {
  children: string | ReactNode;
  onPress: () => void;
  textStyle: TextStyle;
  buttonStyle: ViewStyle;
}

// Customer Screen Props
export interface CustomerScreenProps {
  style: ViewStyle;
}

// Changelog Screen Props
export interface ChangelogScreenProps {
  containerStyle: ViewStyle;
  onPress: () => void;
}

// Signup Screen Props
export interface SignupScreenProps {
  onPress: () => void;
  style?: ViewStyle;
}
