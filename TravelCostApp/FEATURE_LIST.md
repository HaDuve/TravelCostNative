# Travel Cost App - User-Facing Features List

This document contains a comprehensive list of all user-facing buttons, switches, toggles, and interactive elements in the app (excluding navigation). This list is intended for analytics tracking implementation.

## Expense Management (20 features)

### Expense Creation & Editing

1. **Add Expense Button** - Floating action button to create new expense (`components/ManageExpense/AddExpenseButton.tsx`)
2. **Confirm Expense Button** - Save/confirm expense creation or edit (`components/ManageExpense/ExpenseForm.tsx`)
3. **Cancel Expense Button** - Cancel expense creation/edit (`components/ManageExpense/ExpenseForm.tsx`)
4. **Delete Expense Button** - Delete an expense (trash icon) (`screens/ManageExpense.tsx`)
5. **Get Local Price Button** - ChatGPT integration to get local price recommendations (`components/ManageExpense/ExpenseForm.tsx`)

### Expense Form Controls

6. **Amount Input Field** - Enter expense amount (`components/ManageExpense/ExpenseForm.tsx`)
7. **Description Input Field** - Enter expense description (`components/ManageExpense/ExpenseForm.tsx`)
8. **Category Picker** - Select expense category (`screens/CategoryPickScreen.tsx`)
9. **Currency Picker** - Select currency for expense (`components/Currency/CurrencyPicker.tsx`)
10. **Country Picker** - Select country for expense (`components/Currency/CountryPicker.tsx`)
11. **Date Picker** - Select expense date (`components/UI/DatePickerModal.tsx`)
12. **Date Range Picker** - Select date range for ranged expenses (`components/UI/DatePickerModal.tsx`)

### Expense Status & Splitting

13. **Is Paid Toggle** - Segmented button to mark expense as paid/not paid (`components/ManageExpense/ExpenseForm.tsx`)
14. **Is Special Expense Toggle** - Switch to mark expense as special/hidden (`components/ManageExpense/ExpenseForm.tsx`)
15. **Who Paid Selector** - Select who paid for the expense (`components/ManageExpense/ExpenseForm.tsx`)
16. **Split Type Selector** - Choose split type (Equal, Exact, Percent, Self) (`components/ManageExpense/ExpenseForm.tsx`)
17. **Split List Editor** - Edit individual split amounts (`components/ManageExpense/ExpenseForm.tsx`)
18. **Recalculate Splits Button** - Recalculate split amounts (`components/ManageExpense/ExpenseForm.tsx`)

### Expense Actions

19. **Quick Sum Button** - Add current amount to running total (`components/ManageExpense/ExpenseForm.tsx`)
20. **Show/Hide Advanced Options** - Toggle advanced expense options visibility (`components/ManageExpense/ExpenseForm.tsx`)

## Trip Management (12 features)

### Trip Creation & Editing

21. **Create New Trip Button** - Create a new trip budget (`components/ManageTrip/TripForm.tsx`)
22. **Edit Trip Button** - Edit existing trip details (`components/ManageTrip/TripForm.tsx`)
23. **Confirm Trip Button** - Save trip creation/edit (`components/ManageTrip/TripForm.tsx`)
24. **Cancel Trip Button** - Cancel trip creation/edit (`components/ManageTrip/TripForm.tsx`)
25. **Set Active Trip Button** - Set trip as currently active (`components/ManageTrip/TripForm.tsx`)

### Trip Form Controls

26. **Trip Name Input** - Enter trip name (`components/ManageTrip/TripForm.tsx`)
27. **Total Budget Input** - Enter total trip budget (`components/ManageTrip/TripForm.tsx`)
28. **Daily Budget Input** - Enter daily budget (`components/ManageTrip/TripForm.tsx`)
29. **Trip Currency Picker** - Select trip currency (`components/ManageTrip/TripForm.tsx`)
30. **Trip Date Range Picker** - Select trip start and end dates (`components/ManageTrip/TripForm.tsx`)
31. **Dynamic Daily Budget Toggle** - Enable/disable dynamic daily budget calculation (`components/ManageTrip/TripForm.tsx`)

### Trip Sharing

32. **Join Trip Button** - Join an existing trip via invite (`screens/JoinTrip.tsx`)

## Financial & Split Management (8 features)

### Split Calculations

33. **Simplify Splits Button** - Simplify split calculations (`screens/SplitSummaryScreen.tsx`)
34. **Settle All Splits Button** - Mark all splits as settled (`screens/SplitSummaryScreen.tsx`)
35. **Back Button (Split Summary)** - Return from split summary (`screens/SplitSummaryScreen.tsx`)
36. **Mark Payment Button** - Mark individual payment as completed (`screens/SplitSummaryScreen.tsx`)

### Financial Overview

37. **Open Splits Summary Button** - Navigate to splits summary (`screens/FinancialScreen.tsx`)
38. **Financial Overview Toggle** - View financial overview (`screens/FinancialScreen.tsx`)
39. **Export Triggered** - Export financial data (if implemented)
40. **Payment Marked** - Mark payment as completed (if implemented)

## Finder & Search (6 features)

41. **Search Expenses Input** - Search expenses by description, category, currency, country, or traveler (`screens/FinderScreen.tsx`)
42. **Date Filter Toggle** - Enable/disable date filtering (`screens/FinderScreen.tsx`)
43. **Date Range Selector** - Select date range for filtering (`screens/FinderScreen.tsx`)
44. **Find Button** - Execute search with filters (`screens/FinderScreen.tsx`)
45. **Clear Search Button** - Clear search query and filters (`screens/FinderScreen.tsx`)
46. **Search Query Checkbox** - Toggle search query filter (`screens/FinderScreen.tsx`)

## Overview & Charts (5 features)

47. **Toggle Graph/Chart View** - Switch between bar chart and pie chart (`screens/OverviewScreen.tsx`)
48. **Period Selector** - Select time period (Today, Week, Month, Year, Total) (`screens/OverviewScreen.tsx`)
49. **Refresh Expenses** - Pull to refresh expense list (`screens/OverviewScreen.tsx`)
50. **Expense Item Press** - View/edit expense on press (`screens/OverviewScreen.tsx`)
51. **Category Chart Toggle** - Toggle category breakdown view (`screens/OverviewScreen.tsx`)

## Profile & Settings (15 features)

### Profile Management

52. **Edit Profile Button** - Edit user profile (`components/ManageProfile/ProfileForm.tsx`)
53. **Save Profile Button** - Save profile changes (`components/ManageProfile/ProfileForm.tsx`)
54. **Logout Button** - Log out of account (`components/ManageProfile/ProfileForm.tsx`)
55. **Delete Account Button** - Delete user account (`screens/SettingsScreen.tsx`)

### Trip History

56. **Create New Trip Button (Profile)** - Create trip from profile screen (`screens/ProfileScreen.tsx`)
57. **View Trip Summary Button** - View summary of all trips (`screens/ProfileScreen.tsx`)
58. **Trip List Item Press** - Select and view trip details (`components/ProfileOutput/TripList.tsx`)

### Settings Toggles

59. **Show Flags Toggle** - Show/hide country flags in expense list (`components/UI/SettingsSection.tsx`)
60. **Show Who Paid Toggle** - Show/hide who paid indicator (`components/UI/SettingsSection.tsx`)
61. **Always Show Advanced Toggle** - Always show advanced expense options (`components/UI/SettingsSection.tsx`)
62. **Skip Category Pick Screen Toggle** - Skip category selection screen (`components/UI/SettingsSection.tsx`)
63. **Show Internet Speed Toggle** - Display internet connection speed (`components/UI/SettingsSection.tsx`)
64. **Hide Special Expenses Toggle** - Hide special expenses from main view (`components/UI/SettingsSection.tsx`)
65. **Disable Number Animations Toggle** - Disable animated number transitions (`components/UI/SettingsSection.tsx`)

### Settings Actions

66. **Reset App Introduction Button** - Reset onboarding tour (`screens/SettingsScreen.tsx`)
67. **Visit Food For Nomads Button** - Open external website (`screens/SettingsScreen.tsx`)
68. **Feedback Button** - Open feedback form (`screens/ProfileScreen.tsx`)

## Premium & Monetization (8 features)

69. **View Paywall Button** - Navigate to premium paywall (`components/Premium/PayWall.tsx`, `screens/SettingsScreen.tsx`)
70. **Purchase Monthly Package Button** - Buy monthly subscription (`components/Premium/PackageItem.tsx`)
71. **Purchase Yearly Package Button** - Buy yearly subscription (`components/Premium/PackageItem.tsx`)
72. **Purchase Lifetime Package Button** - Buy lifetime subscription (`components/Premium/PackageItem.tsx`)
73. **Restore Purchases Button** - Restore previous purchases (`screens/SettingsScreen.tsx`)
74. **Premium Blur Card Button** - Access premium from blurred card (`components/Premium/BlurPremium.tsx`)
75. **Customer Screen Button** - View customer/subscription info (`screens/CustomerScreen.tsx`)
76. **Back from Paywall Button** - Return from paywall screen (`components/Premium/PayWall.tsx`)

## AI & Smart Features (3 features)

77. **Get Local Price Button (Profile)** - Get local price recommendations (`components/Settings/GetLocalPriceButton.tsx`)
78. **ChatGPT Recommendation Used** - When user uses ChatGPT price/deal recommendation (`screens/ChatGPTDealScreen.tsx`)
79. **Category Suggestion Accepted** - When user accepts AI category suggestion (if implemented)

## Authentication (4 features)

80. **Sign Up Button** - Create new account (`screens/SignupScreen.tsx`)
81. **Login Button** - Log in to existing account (`screens/LoginScreen.tsx`)
82. **Switch Auth Mode** - Toggle between login and signup (`components/Auth/AuthContent.tsx`)
83. **Submit Auth Form** - Submit login/signup credentials (`components/Auth/AuthContent.tsx`)

## Category Management (3 features)

84. **Create Category Button** - Create custom expense category (`screens/ManageCategoryScreen.tsx`)
85. **Edit Category Button** - Edit existing category (`screens/ManageCategoryScreen.tsx`)
86. **Delete Category Button** - Delete custom category (`screens/ManageCategoryScreen.tsx`)

## Bulk Actions (2 features)

87. **Bulk Expense Action** - Perform action on multiple expenses (if implemented)
88. **Select Multiple Expenses** - Multi-select mode for expenses (if implemented)

## Other Features (2 features)

89. **Onboarding Tour Start** - Start app introduction tour (`screens/ProfileScreen.tsx`)
90. **Onboarding Tour Skip** - Skip or stop onboarding tour (`screens/ProfileScreen.tsx`)

---

**Total Features: 90**

## Notes

- Navigation buttons (back, forward, tab bar) are excluded as per requirements
- Some features may be conditional based on premium status or user state
- Features marked "if implemented" should be verified in codebase
- This list should be reviewed and updated as new features are added
