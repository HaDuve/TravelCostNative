import { simplifySplits } from "../util/split";
const en = {
  // standard strings
  signoutBtn: "Sign out",
  signOutAlertTitle: "Cancel",
  signOutAlertMess: "Are you sure you want to sign out?",
  confirm: "Okay",
  confirm2: "Confirm",
  continue: "Continue",
  back: "Back",
  cancel: "Cancel",
  delete: "Delete",
  saveChanges: "Save Changes",
  add: "Add",
  update: "Update",
  sure: "Are you sure?",
  sureExt: "Are you sure you want to delete this expense?",
  resetBtn: "Reset password",
  yes: "Yes",
  no: "No",

  // Other Strings
  overview: "Overview",
  categories: "Categories",
  invitationText: "I have an invitation from another Traveller!",
  joinTrip: "Do you want to join the Trip",
  joinLink: "You can paste your Invitation Link here!",
  join: "Join",
  createFirstTrip: "Create first trip",
  myTrips: "My Trips",
  chooseAction: "Please choose action:",
  inviteTravellers: "Invite other travellers",
  setActiveTrip: "Set as active Trip",
  calcOpenSplits: "Calculate open splits",
  daily: "Daily",

  // today - yesterday etc.
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  lastWeek: "Last Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  thisYear: "This Year",
  lastYear: "Last Year",

  // last periodname
  last: "Last",
  days: "days",
  weeks: "weeks",
  months: "months",
  years: "years",

  // Category Names
  catFoodString: "Food",
  catIntTravString: "Flights",
  catAccoString: "Accomodation",
  catNatTravString: "Transport",
  catOtherString: "Other",
  catNewString: "New Category",

  // Form Labels
  nameLabel: "Name",
  priceIn: "Price in ",
  showMoreOptions: "Show more options",
  showLessOptions: "Show less options",
  currencyLabel: "Currency",
  baseCurrency: "Home currency",
  descriptionLabel: "Description",
  dateLabel: "Date",

  // Modal Titles
  editExp: "Edit Expense",
  addExp: "Add Expense",
  whoPaid: "Who paid?",
  howShared: "How are the costs shared?",
  whoShared: "Who is the cost shared between?",
  paidSelf: "Paid for self",
  sharedEq: "Shared equally",
  sharedEx: "Individually shared",

  // Dropdown Labels
  todayLabel: "Today",
  weekLabel: "Week",
  monthLabel: "Month",
  yearLabel: "Year",
  totalLabel: "Total",

  // Error Messages
  fetchError: "Could not fetch expenses from the database! ",
  deleteError: "Could not delete expense - please try again later!",
  profileError: "Could not save profile - please try again later!",
  fallbackTextExpenses:
    "No expenses in this time period yet. Add new expenses with the Button below!",
  fallbackTimeFrame: "Please choose a Time Frame in the Dropdown Bar.",
  invalidInput: "Invalid input values - please check your entered data!",

  // Walkthrough Texts
  walk1:
    "Welcome to Budget for Nomads! 🎉 We're excited to have you join us on your finance travel journey!",
  walk2:
    "Let's get started by adding your expenses. 🛍️ Just tap the '+' button and enter your expense details. Go ahead and give it a try now!",
  walk3:
    "Keep track of your budget on a daily or monthly basis. 📊 Use the button to switch between time periods and stay on top of your spending! 🤑",
  walk4:
    "View your expenses by category or daily overview. 📈 Use the toggle to switch between the two and get a detailed view of your finances! 🤑",
  walk5:
    "Ready for your next adventure? 🌎 Create a new trip and start budgeting for your travels! 🧳",
  walk6:
    "View all your trips and keep track of your current one. 🗺️ Your active trip will be highlighted in green. 🟢",
  walk7:
    "Bring a friend along on your travels! 👫 Invite a fellow nomad to your active trip and budget together. 💸",
  walk8:
    "Enjoy your journey with Budget for Nomads! 🎉 We're here to help you stay on budget while you explore the world. 🌍",

  // Tabbar labels
  expensesTab: "Expenses",
  overviewTab: "Overview",
  profileTab: "Profile",
  settingsTab: "Settings",

  // Settings Labels
  logoutLabel: "Logout",
  joinTripLabel: "Join Trip",
  simplifySplitsLabel: "Open Splits Summary",
  resetAppIntroductionLabel: "Reset App Introduction",
  visitFoodForNomadsLabel: "Visit Food For Nomads",

  // Trip Form Labels
  tripFormTitleNew: "New Trip Budget",
  tripFormTitleEdit: "Edit Trip Budget",
  tripNameLabel: "Trip Name",
  baseCurrencyLabel: "Home Currency",
  totalBudgetLabel: "Total Budget in",
  dailyBudgetLabel: "Daily Budget in",
  enterNameAlert: "Please enter a Name for your new Trip Budget",
  enterBudgetAlert: "Please enter a Total Budget higher than Daily Budget",
  selectCurrencyAlert: "Please select a Base Currency for your Trip Budget",
  deleteTrip: "Delete Trip",
  deleteTripSure: "Are you sure you want to delete this Trip?",
  setActive: "Set as active Trip",
  datePickerLabel: "Trip Start and End",

  // Loading Strings
  loadingYourTrip: "Loading your Trip...",
  loading: "Loading...",

  // Invite Screen
  inviteMessage:
    "Hey there! I'm using Budget For Nomads to plan my next trip and I wanted to invite you to join me. Before you click on the link below, make sure to install the app first. Once you're done, just click the link and join our trip. Let's make this trip unforgettable together!",
  noTrip: "Could not find trip!",
  tryAgain: "Please try again later.",

  // Login and Signup Screen
  noConnection: "No internet connection",
  checkConnectionError: "Please check your internet connection and try again",
  exceptionError: "Exceptional Error",
  authError: "Authentication failed!",
  createErrorText:
    "Could not create user, please check your input and try again later.",
  authErrorText:
    "Failed to login. Wrong password or Username? Please try again later.",
  loginLoadText: "Logging in user...",
  createUserLoadText: "Creating user...",
  noAccountText: "Don't have an account?",
  alreadyAccountText: "Already have an account?",
  createNewUser: "Create a new user",
  loginInstead: "Log in instead",
  loginText: "Login",
  createAccountText: "Create account",
  welcomeSigninText:
    "Welcome back, sign in to continue using the Expense Tracker",
  welcomeCreateAccountText:
    "Enter your credentials here or signup easily via Google.",
  emailLabel: "Email Address",
  passwordLabel: "Password",
  signupComingSoonAlert: "Sign Up / Login with Google function coming soon... ",
  signupGoogleText: "Sign Up with Google",

  // Onboarding Screens
  onb1: "Travel in Style on a Budget",
  onb1t:
    "Maximize your travel budget without sacrificing comfort or experiences.",
  onb2: "Simplify Group Travel Expenses",
  onb2t:
    "Easily split and track travel costs with friends and family, and make the most of your budget.",
  onb3: "Achieve Your Financial Goals",
  onb3t:
    "Take control of your finances and plan your dream trip with Budget for Nomads budgeting and tracking tools.",

  // Filtered expenses
  noExpensesText: "No expenses -",
  duplicateExpensesText: " - duplicate expenses",
  splitUpExpensesText: " - split up expenses",

  // duplOrSplitUp
  rangedDatesTitle: "Long-term expenses",
  rangedDatesText:
    "Do you want to multiply or split the costs over several days?",
  duplicateExpenses: "Duplicate",
  splitUpExpenses: "Split Up",

  paywallTitle: "Become a Premium Nomad!",
  paywallSubtitle: "Make your journey even easier with additional features:",
  paywallFeature1: "✓ Create your own categories",
  paywallFeature2: "✓ Simplify debt settlements",
  paywallFeature3: "✓ Better overview with advanced charts",
  paywallFeature4: "✓ Search expenses with filtering options",
  paywallFeature5: "✓ Ask ChatGPT if you got a good deal",
  paywallFeature6: "Start your 1-week trial subscription now.",
  paywallLegal1:
    "At the end of the 1-week trial period, your iTunes account will be charged $2. The subscription will automatically renew unless canceled within 24 hours before the end of the current period. You can cancel anytime through your iTunes account. Any unused portion of a free trial will be forfeited upon subscription purchase. For more information, please refer to our terms and conditions and privacy policy.",
  paywallToS: "Terms of Service",
  paywallPP: "Privacy Policy",

  //auth form
  nameInvalidInfoText: "Please enter a name!",
  emailInvalidInfoText: "Please enter a valid email address!",
  passwordInvalidInfoText:
    "Please enter a password with at least 6 characters!",

  // new stuff
  shareTripLabel: "Share Trip",
  tourGuideLabelPrevious: "Previous",
  tourGuideLabelNext: "Next",
  tourGuideLabelSkip: "Skip",
  tourGuideLabelFinish: "Finish",
  countryLabel: "Country",
  askChatGptPost: "Ask ChatGPT: Was this a good deal?",
  askChatGptPre: "Ask ChatGPT: Would this be a good deal?",
  askChatGptTitle: "Ask ChatGPT",
  askingChatGpt: "Asking ChatGPT for a good deal...",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  total: "Total",
  budget: "Budget",
  noTotalBudget: "No Total Budget!",
  infinityLeftToSpend: "You have ∞ left to spend!",
  youHaveXLeftToSpend1: "You have ",
  youHaveXLeftToSpend2: " left to spend!",
  underBudget: "Under the budget by",
  overBudget: "Over the budget by",
  exceededBudgetByX1: "You exceeded your budget by ",
  slowConnection: "Slow Connection",
  megaBytePerSecond: "Mbps",
  offlineMode: "Offline Mode",
  notPaidLabel: "Not Paid Yet",
  paidLabel: "Paid Back",
  travellers: "Travellers",
  countries: "Countries",
  currencies: "Currencies",
  expenses: "Expenses",
  welcomeToBudgetForNomads: "Welcome to Budget for Nomads",
  pleaseCreateTrip: "Please Create or Join a Trip to get started!",
  finderTitle: "Finder",
  search: "Search",
  finding: "Finding",
  showXResults1: "Show",
  showXResults2: "Results",
  noResults: "No Results",
  splitSummaryTitle: "Split Summary",
  yourMoneyBack: "Your money back",
  youStillOwe: "You still owe",
  error: "Error",
  errorSplits: "Could not fetch splits!",
  alertNoSplits: "No Splits to Simplify",
  XowesYtoZ1: "owes",
  XowesYtoZ2: "to",
  simplifySplits: "Simplify Splits",
  settleSplits: "Settle Splits",
  confirmSettle: "Settle",
  sureSettleSplits:
    "Are you sure you want to settle all splits? Has everyone gotten their money back?",
  sureDeleteAccount:
    "This will unreversibly delete your Budget for Nomads Account!",
  premiumNomad: "Premium Nomad",
  premiumNomadActiveNow: "You are a premium Nomad now!",
  youArePremium: "You are a Premium Nomad!",
  becomePremium: "Become a Premium Nomad!",
  premiumNomadInactive: "You are not a premium Nomad yet!",
  premiumNomadError: "Something went wrong, could not activate premium nomad!",
  settingsTitle: "Settings",
  restorePurchases: "Restore Purchases",
  deleteAccount: "Delete Account",
  settingsSkipCat: "Skip Category Picker",
  settingsShowAdvanced: "Always Show More Options",
  settingsShowFlags: "Show Flag Icons",
  settingsShowInternetSpeed: "Show Internet Speed",
  settingsShowTravellerIcon: "Show Traveller Icons",
  // new Stuff part 2
  newCatNamePlaceholder: "Enter new category name ...",
  reset: "Reset",
  sureResetCategories: "Are you sure you want to reset your categories?",
  infoNewCatTitle: "New Category Info",
  infoNewCatText:
    "Enter a name for your Category and then press the symbol for your new Category." +
    "\n\n Confirm your new Category with the <Add> button.",
  infoHomeCurrencyTitle: "Home Currency Info",
  infoHomeCurrencyText:
    "Setup your home currency here (e.g. the currency from the country in which you live)." +
    "\n\n The country will not be saved and is only helpful for finding your currency." +
    "\n\n This currency will be presented in the app and all other currencies you use on your trip will be converted into this one.",
  infoTotalBudgetTitle: "Total Budget Info",
  infoTotalBudgetText:
    "Setup your total budget here (e.g. the amount of money for the entire trip)." +
    "\n\n You can press the calculate button to auto-calculate the Total Budget from the Daily Budget * Trip Start and End Date." + //i18n.t("currencyInfoContent");
    "\n\n The total Budget is optional.",
  infoDailyBudgetTitle: "Daily Budget Info",
  infoDailyBudgetText:
    "Setup your Daily budget here (e.g. the average amount of money to spend per day)." +
    "If you don't know how much exactly you want to spend, just write down an estimate." +
    "\n\n You can press the calculate button to auto-calculate the Daily Budget from the Total Budget / Trip Start and End Date.",
  infoTripDatesTitle: "Trip Start and End Info",
  infoTripDatesText:
    "Setup your Trip Start and End Date here (e.g. the dates of your trip)." +
    "\n\n The trip start and end is optional.",
  comingSoon: "Coming Soon...",
  comingSoonRangedDates:
    "Changing the dates of expenses with a range of dates is not yet possible.",
  comingSoonDuplOrSplit:
    "Changing the splitting of expenses with a range of dates is not yet possible.",
  sorry: "Sorry!",
  sorrySplitList:
    "I could not calculate a valid split. Please check your input. \n\n You can also long-press the recalculate button to reset all splits!",
  errorPurchasePackage: "Error purchasing package",
  errorPurchasePackageText: "Please restart the app or try again later.",
  errorGetOffers: "Error getting offers",
  errorGetOffersText: "Please restart the app or try again later.",
  errorShareTrip: "Error sharing the trip",
  errorShareTripText: "Please restart the app or try again later.",
  inviteTraveller: "Invite other Traveller",
  toastLoginError1: "Login error",
  toastLoginError2: "Please login again!",
  toastAccountError1: "Account not found",
  toastAccountError2: "Please create a new account first!",
  toastEmailError1: "No email found",
  toastEmailError2: "Please try again with a different method.",
  toastAppleError1: "Apple Sign In Error",
  toastAppleError2: "User canceled the sign-in flow",
  toastDeleting1: "Deleting",
  toastDeleting2: "Please leave the app open...",
  error2: "Please try again later.",
  toastSaving1: "Saving Changes",
  toastSaving2: "Please leave the app open...",
  toastPurchaseSuccess1: "Purchase successful",
  toastPurchaseSuccess2: "You are now a Premium Nomad Member",
  toastPremiumFetchError: "Error fetching premium status",
  toastSavingError1: "Could not save data",
  toastNameError1: "No Name found",
  toastNameError2:
    "There might be a problem with the apple signin process. Please try again with a different method.",
  toastAccDeleted1: "Account Deleted",
  toastAccDeleted2: "Your account has been deleted successfully.",
  toastErrorDeleteExp: "Could not delete Expense, please try again!",
  toastErrorUpdateExp: "Could not update Expense, please try again!",
  toastErrorStoreExp: "Could not store Expense, please try again!",
  toastSyncChanges1: "Synchronizing offline changes",
  toastSyncChanges2: "Please leave the app open...",
  toastSyncFinished1: "Online again!",
  toastSyncFinished21: "Synchronized",
  toastSyncFinished22: "offline Changes!",
};
const de = {
  // standard strings
  signoutBtn: "Abmelden",
  signOutAlertTitle: "Abbrechen",
  signOutAlertMess: "Sind Sie sicher, dass Sie sich abmelden wollen?",
  confirm: "Okay",
  confirm2: "Bestätigen",
  continue: "Weiter",
  back: "Zurück",
  cancel: "Abbrechen",
  delete: "Löschen",
  saveChanges: "Änderungen speichern",
  add: "Hinzufügen",
  update: "Aktualisieren",
  sure: "Sind Sie sicher?",
  sureExt: "Sind Sie sicher, dass Sie diese Ausgabe löschen wollen?",
  resetBtn: "Passwort zurücksetzen",
  yes: "Ja",
  no: "Nein",

  // Other Strings
  overview: "Übersicht",
  categories: "Kategorien",
  invitationText: "Ich habe eine Einladung von einem anderen Reisenden!",
  joinTrip: "Möchtest du der Reise beitreten",
  joinLink:
    "Du kannst dein Einladungslink hier reinkopieren um der Reise beizutreten",
  join: "Beitreten",
  createFirstTrip: "Erste Reise erstellen",
  myTrips: "Meine Reisen",
  chooseAction: "Bitte wählen Sie eine Aktion aus:",
  inviteTravellers: "Andere Reisende einladen",
  setActiveTrip: "Als aktive Reise markieren",
  calcOpenSplits: "Berechne offene Schulden",
  daily: "Täglich",

  // today - yesterday etc.
  today: "Heute",
  yesterday: "Gestern",
  thisWeek: "Diese Woche",
  lastWeek: "Letzte Woche",
  thisMonth: "Diesen Monat",
  lastMonth: "Letzten Monat",
  thisYear: "Dieses Jahr",
  lastYear: "Letztes Jahr",

  // last periodname
  last: "Letzte",
  days: "Tage",
  weeks: "Wochen",
  months: "Monate",
  years: "Jahre",

  // Category Names
  catFoodString: "Essen",
  catIntTravString: "Flüge",
  catAccoString: "Unterkunft",
  catNatTravString: "Transport",
  catOtherString: "Andere",
  catNewString: "Neue Kategorie",

  // Form Labels
  nameLabel: "Name",
  priceIn: "Preis in ",
  showMoreOptions: "Zeige mehr Optionen",
  showLessOptions: "Zeige weniger Optionen",
  currencyLabel: "Währung",
  baseCurrency: "Heimatwährung",
  descriptionLabel: "Beschreibung",
  dateLabel: "Datum",

  // Modal Titles
  editExp: "Ausgabe bearbeiten",
  addExp: "Ausgabe hinzufügen",
  whoPaid: "Wer hat bezahlt?",
  howShared: "Wie wurden die Kosten geteilt?",
  whoShared: "Zwischen wem wurden die Kosten geteilt?",
  paidSelf: "Für sich selbst gezahlt",
  sharedEq: "Gleich verteilt",
  sharedEx: "Individuell aufgeteilt",

  // Dropdown Labels
  todayLabel: "Heute",
  weekLabel: "Woche",
  monthLabel: "Monat",
  yearLabel: "Jahr",
  totalLabel: "Total",

  // Error Messages
  fetchError: "Konnte die Ausgaben nicht von der Datenbank abrufen! ",
  deleteError:
    "Die Ausgabe konnte nicht gelöscht werden. Versuchen Sie es später noch einmal!",
  profileError:
    "Das Profil konnte nicht gespeichert werden. Versuchen Sie es später noch einmal!",

  fallbackTextExpenses:
    "Noch keine Ausgaben in diesem Zeitraum. Neue Ausgaben mit der Schaltfläche unten hinzufügen!",
  fallbackTimeFrame:
    "Bitte wählen Sie einen Zeitraum oben in der Dropdown-Leiste.",
  invalidInput: "Ungültige Eingabe - Bitte überprüfe die eingegebenen Daten!",

  // Walkthrough Texts
  walk1:
    "Herzlich willkommen bei Budget for Nomads! 🎉 Wir freuen uns, dass du uns auf deiner Finanzreise begleitest!",
  walk2:
    "Lass uns loslegen, indem du deine Ausgaben hinzufügst. 🛍️ Tippe einfach auf das '+' Symbol und gib deine Ausgabendetails ein. Probiere es jetzt einfach aus!",
  walk3:
    "Behalte dein Budget täglich oder monatlich im Auge. 📊 Verwende den Schalter, um zwischen den Optionen zu wechseln und behalte deine Ausgaben im Blick! 🤑",
  walk4:
    "Schau dir deine Ausgaben nach Kategorie oder täglichem Überblick an. 📈 Verwende den Schalter, um zwischen den beiden Optionen zu wechseln und erhalte eine detaillierte Ansicht deiner Finanzen! 🤑",
  walk5:
    "Bereit für dein nächstes Abenteuer? 🌎 Erstelle eine neue Reise und beginne mit der Budgetierung für deine Reisen! 🧳",
  walk6:
    "Sieh dir alle deine Reisen an und behalte deine aktuelle im Blick. 🗺️ Deine aktive Reise wird grün hervorgehoben. 🟢",
  walk7:
    "Nimm einen Freund auf deine Reisen mit! 👫 Lade einen anderen Nomaden zu deiner aktiven Reise ein und budgetiert gemeinsam. 💸",
  walk8:
    "Genieße deine Reise mit Budget for Nomads! 🎉 Wir sind hier, um dir zu helfen, dein Budget im Blick zu behalten, während du die Welt erkundest. 🌍",

  // Tabbar labels
  expensesTab: "Ausgaben",
  overviewTab: "Übersicht",
  profileTab: "Profil",
  settingsTab: "Optionen",

  // Settings Labels
  logoutLabel: "Ausloggen",
  joinTripLabel: "Reise beitreten",
  simplifySplitsLabel: "Offene Schulden Übersicht",
  resetAppIntroductionLabel: "App Einführung wiederholen",
  visitFoodForNomadsLabel: "Food For Nomads besuchen",

  // Trip Form Labels
  tripFormTitleNew: "Neue Reise erstellen",
  tripFormTitleEdit: "Reise bearbeiten",
  tripNameLabel: "Name der Reise",
  tripCurrencyLabel: "Deine Heimatwährung in",
  totalBudgetLabel: "Gesamtbudget in",
  dailyBudgetLabel: "Tägliches Budget in",
  enterNameAlert: "Bitte gib einen Namen für deine Reise ein!",
  enterBudgetAlert: "Bitte gib ein höheres Gesamtbudget als Tagesbudget ein!",
  selectCurrencyAlert: "Bitte wähle deine Heimatwährung aus!",
  deleteTrip: "Reise löschen",
  deleteTripSure: "Bist du dir sicher, dass du diese Reise löschen möchtest?",
  setActive: "Als aktive Reise markieren",
  datePickerLabel: "Reise Start und Ende",

  // Loading Strings
  loading: "Laden...",
  loadingYourTrip: "Lade deine Reise...",

  // Invite Screen
  inviteMessage:
    "Hey! Ich benutze Budget For Nomads, um meine nächste Reise zu planen, und ich möchte dich einladen. Bevor du auf den unten stehenden Link klickst, stelle sicher, dass du die App zuerst installierst. Sobald du fertig bist, klicke einfach auf den Link und schließe dich unserer Reise an. Lass uns diese Reise zusammen unvergesslich machen!",
  noTrip: "Reise nicht gefunden!",
  tryAgain: "Bitte versuche es später erneut!",

  // Login and Signup Screen
  noConnection: "Keine Internetverbindung",
  checkConnectionError:
    "Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut",
  exceptionError: "Außergewöhnlicher Fehler",
  authError: "Authentifizierung fehlgeschlagen!",
  createErrorText:
    "Benutzer konnte nicht erstellt werden, bitte überprüfen Sie Ihre Eingabe und versuchen Sie es später erneut.",
  authErrorText:
    "Anmeldung fehlgeschlagen. Falsches Passwort oder Benutzername? Bitte versuchen Sie es später erneut.",
  loginLoadText: "Benutzer anmelden...",
  createUserLoadText: "Benutzer erstellen...",
  noAccountText: "Sie haben noch kein Konto?",
  alreadyAccountText: "Haben Sie bereits ein Konto?",
  createNewUser: "Neuen Benutzer erstellen",
  loginInstead: "Stattdessen anmelden",
  loginText: "Anmelden",
  createAccountText: "Konto erstellen",
  welcomeSigninText:
    "Willkommen zurück, melden Sie sich an, um die Expense Tracker weiter zu nutzen",
  welcomeCreateAccountText:
    "Geben Sie hier Ihre Anmeldeinformationen ein oder melden Sie sich einfach über Google an.",
  emailLabel: "E-Mail-Adresse",
  passwordLabel: "Passwort",
  signupComingSoonAlert:
    "Anmelden / Einloggen mit Google Funktion kommt bald... ",
  signupGoogleText: "Mit Google anmelden",
  onb1: "Reisen Sie stilvoll mit kleinem Budget",
  onb1t:
    "Maximieren Sie Ihr Reisebudget, ohne auf Komfort oder Erlebnisse zu verzichten.",
  onb2: "Vereinfachen Sie die Gruppenreisekosten",
  onb2t:
    "Teilen und verfolgen Sie Reisekosten mit Freunden und Familie einfach und machen Sie das Beste aus Ihrem Budget.",
  onb3: "Erreichen Sie Ihre finanziellen Ziele",
  onb3t:
    "Übernehmen Sie die Kontrolle über Ihre Finanzen und planen Sie Ihre Traumreise mit Budget for Nomads Budgetierung und Tracking-Tools.",

  // Filtered expenses
  noExpensesText: "Keine Ausgaben -",
  duplicateExpensesText: " - duplizierte Ausgaben",
  splitUpExpensesText: " - aufgeteilte Ausgaben",

  // duplOrSplitUp
  rangedDatesTitle: "Langfristige Ausgaben",
  rangedDatesText:
    "Möchten Sie die Kosten über mehrere Tage vervielfachen oder aufsplitten?",
  duplicateExpenses: "Vervielfachen",
  splitUpExpenses: "Aufsplitten",

  // Paywall and Premium
  paywallTitle: "Werde Premium Nomade!",
  paywallSubtitle:
    "Lass dir deine Reise mit noch mehr Funktionen erleichtern: ",
  paywallFeature1: "✓ Erstelle eigene Kategorien",
  paywallFeature2: "✓ Vereinfache Schuldenbegleichungen",
  paywallFeature3: "✓ Behalte mehr Überblick mit erweiterten Diagrammen",
  paywallFeature4: "✓ Suche Ausgaben mit Filterfunktionen",
  paywallFeature5: "✓ Frage ChatGPT ob du einen guten Deal gemacht hast",
  paywallFeature6: "Beginne jetzt dein 1-wöchiges Probeabo. ",
  paywallLegal1:
    "Am Ende der 1-wöchigen Testphase wird dein iTunes-Konto mit einem " +
    "Betrag von 2$ belastet. Das Abonnement verlängert sich automatisch, " +
    "wenn es nicht innerhalb von 24 Stunden vor Ablauf der aktuellen Periode" +
    " gekündigt wird. Du kannst jederzeit über deinen iTunes-Account kündigen. " +
    "Jeder ungenutzte Teil einer kostenlosen Testversion verfällt, wenn du ein " +
    "Abonnement erwirbst. Weitere Informationen findest du in unseren AGBs und " +
    "Datenschutzrichtlinien.",
  paywallToS: "Nutzungsbedingungen",
  paywallPP: "Datenschutzbestimmungen",

  // auth form
  nameInvalidInfoText: "Bitte gib einen Namen ein!",
  emailInvalidInfoText: "Bitte gib eine gültige E-Mail-Adresse ein!",
  passwordInvalidInfoText:
    "Bitte gib ein Passwort mit mindestens 6 Zeichen ein!",

  // new stuff
  shareTripLabel: "Reise teilen",
  tourGuideLabelPrevious: "Zurück",
  tourGuideLabelNext: "Weiter",
  tourGuideLabelSkip: "Überspringen",
  tourGuideLabelFinish: "Fertigstellen",
  countryLabel: "Land",
  askChatGptPost: "Fragen Sie ChatGPT: War das ein gutes Angebot?",
  askChatGptPre: "Fragen Sie ChatGPT: Wäre das ein gutes Angebot?",
  askChatGptTitle: "Fragen Sie ChatGPT",
  askingChatGpt: "Frage ChatGPT nach einem guten Angebot...",
  day: "Tag",
  week: "Woche",
  month: "Monat",
  year: "Jahr",
  total: "Gesamt",
  budget: "Budget",
  noTotalBudget: "Kein Gesamtbudget!",
  infinityLeftToSpend: "Sie haben ∞ übrig zum Ausgeben!",
  youHaveXLeftToSpend1: "Sie haben noch ",
  youHaveXLeftToSpend2: " übrig zum Ausgeben!",
  underBudget: "Unter dem Budget um",
  overBudget: "Über dem Budget um",
  exceededBudgetByX1: "Sie haben Ihr Budget um ",
  slowConnection: "Langsame Verbindung",
  megaBytePerSecond: "Mbps",
  offlineMode: "Offline-Modus",
  notPaidLabel: "Noch nicht bezahlt",
  paidLabel: "Zurückgezahlt",
  travellers: "Reisende",
  countries: "Länder",
  currencies: "Währungen",
  expenses: "Ausgaben",
  welcomeToBudgetForNomads: "Willkommen bei Budget for Nomads",
  pleaseCreateTrip:
    "Bitte erstellen oder treten Sie einer Reise bei, um zu beginnen!",
  finderTitle: "Finder",
  search: "Suche",
  finding: "Suche",
  showXResults1: "Zeige",
  showXResults2: "Ergebnisse",
  noResults: "Keine Ergebnisse",
  splitSummaryTitle: "Aufteilungszusammenfassung",
  yourMoneyBack: "Ihr Geld zurück",
  youStillOwe: "Sie schulden noch",
  error: "Fehler",
  errorSplits: "Aufteilungen konnten nicht abgerufen werden!",
  alertNoSplits: "Keine Aufteilungen zum Vereinfachen",
  XowesYtoZ1: "schuldet",
  XowesYtoZ2: "zu",
  simplifySplits: "Aufteilungen vereinfachen",
  settleSplits: "Aufteilungen begleichen",
  confirmSettle: "Begleichen",
  sureSettleSplits:
    "Sind Sie sicher, dass Sie alle Aufteilungen begleichen möchten? Hat jeder sein Geld zurückerhalten?",
  sureDeleteAccount:
    "Dies löscht Ihren Budget for Nomads Account unwiderruflich!",
  premiumNomad: "Premium-Nomade",
  premiumNomadActiveNow: "Sie sind jetzt ein Premium-Nomade!",
  youArePremium: "Sie sind ein Premium-Nomade!",
  becomePremium: "Werden Sie ein Premium-Nomade!",
  premiumNomadInactive: "Sie sind noch kein Premium-Nomade!",
  premiumNomadError:
    "Etwas ist schiefgegangen. Premium-Nomade konnte nicht aktiviert werden!",
  settingsTitle: "Einstellungen",
  restorePurchases: "Käufe wiederherstellen",
  deleteAccount: "Account löschen",
  settingsSkipCat: "Kategorieauswahl überspringen",
  settingsShowAdvanced: "Immer mehr Optionen anzeigen",
  settingsShowFlags: "Länderflaggen anzeigen",
  settingsShowInternetSpeed: "Internetgeschwindigkeit anzeigen",
  settingsShowTravellerIcon: "Reisendensymbole anzeigen",
  // new Stuff part 2
  newCatNamePlaceholder: "Geben Sie den Namen der neuen Kategorie ein...",
  reset: "Zurücksetzen",
  sureResetCategories:
    "Sind Sie sicher, dass Sie Ihre Kategorien zurücksetzen möchten?",
  infoNewCatTitle: "Neue Kategorie Info",
  infoNewCatText:
    "Geben Sie einen Namen für Ihre Kategorie ein und drücken Sie dann das Symbol für Ihre neue Kategorie." +
    "\n\n Bestätigen Sie Ihre neue Kategorie mit der Schaltfläche <Hinzufügen>.",
  infoHomeCurrencyTitle: "Heimatwährung Info",
  infoHomeCurrencyText:
    "Richten Sie hier Ihre Heimatwährung ein (z. B. die Währung des Landes, in dem Sie leben)." +
    "\n\n Das Land wird nicht gespeichert und dient nur zur Ermittlung Ihrer Währung." +
    "\n\n Diese Währung wird in der App angezeigt, und alle anderen Währungen, die Sie auf Ihrer Reise verwenden, werden in diese Währung umgerechnet.",
  infoTotalBudgetTitle: "Gesamtbudget Info",
  infoTotalBudgetText:
    "Richten Sie hier Ihr Gesamtbudget ein (z. B. den Geldbetrag für die gesamte Reise)." +
    "\n\n Sie können auf die Schaltfläche Berechnen drücken, um das Gesamtbudget aus dem Tagesbudget * Reiseanfangs- und Reiseenddatum automatisch berechnen zu lassen." +
    "\n\n Das Gesamtbudget ist optional.",
  infoDailyBudgetTitle: "Tagesbudget Info",
  infoDailyBudgetText:
    "Richten Sie hier Ihr Tagesbudget ein (z. B. den durchschnittlichen Geldbetrag, den Sie pro Tag ausgeben möchten)." +
    "Wenn Sie nicht genau wissen, wie viel Sie ausgeben möchten, geben Sie einfach eine Schätzung ein." +
    "\n\n Sie können auf die Schaltfläche Berechnen drücken, um das Tagesbudget aus dem Gesamtbudget / Reiseanfangs- und Reiseenddatum automatisch berechnen zu lassen.",
  infoTripDatesTitle: "Trip-Start und Enddaten",
  infoTripDatesText:
    "Legen Sie hier das Start- und Enddatum Ihrer Reise fest (z. B. die Daten Ihrer Reise).\n\n Der Start und das Ende der Reise sind optional.",
  comingSoon: "Demnächst...",
  comingSoonRangedDates:
    "Das Ändern der Ausgaben mit einem Datumsbereich ist noch nicht möglich.",
  comingSoonDuplOrSplit:
    "Das Ändern der Aufteilung von Ausgaben mit einem Datumsbereich ist noch nicht möglich.",
  sorry: "Entschuldigung!",
  sorrySplitList:
    "Ich konnte eine gültige Aufteilung nicht berechnen. Bitte überprüfen Sie Ihre Eingabe.\n\n Sie können auch lange auf die Neuberechnen-Schaltfläche drücken, um alle Aufteilungen zurückzusetzen!",
  errorPurchasePackage: "Fehler beim Kauf des Pakets",
  errorPurchasePackageText:
    "Bitte starten Sie die App neu oder versuchen Sie es später erneut.",
  errorGetOffers: "Fehler beim Abrufen von Angeboten",
  errorGetOffersText:
    "Bitte starten Sie die App neu oder versuchen Sie es später erneut.",
  errorShareTrip: "Fehler beim Teilen der Reise",
  errorShareTripText:
    "Bitte starten Sie die App neu oder versuchen Sie es später erneut.",
  inviteTraveller: "Andere Reisende einladen",
  toastLoginError1: "Anmeldefehler",
  toastLoginError2: "Bitte melden Sie sich erneut an!",
  toastAccountError1: "Konto nicht gefunden",
  toastAccountError2: "Bitte erstellen Sie zuerst ein neues Konto!",
  toastEmailError1: "Keine E-Mail gefunden",
  toastEmailError2: "Bitte versuchen Sie es erneut mit einer anderen Methode.",
  toastAppleError1: "Apple-Anmeldefehler",
  toastAppleError2: "Benutzer hat den Anmeldevorgang abgebrochen",
  toastDeleting1: "Löschen",
  toastDeleting2: "Bitte lassen Sie die App geöffnet...",
  error2: "Bitte versuchen Sie es später erneut.",
  toastSaving1: "Änderungen speichern",
  toastSaving2: "Bitte lassen Sie die App geöffnet...",
  toastPurchaseSuccess1: "Kauf erfolgreich",
  toastPurchaseSuccess2: "Sie sind jetzt ein Premium-Nomadenmitglied",
  toastPremiumFetchError: "Fehler beim Abrufen des Premium-Status",
  toastSavingError1: "Daten konnten nicht gespeichert werden",
  toastNameError1: "Kein Name gefunden",
  toastNameError2:
    "Es könnte ein Problem mit dem Apple-Anmeldevorgang geben. Bitte versuchen Sie es erneut mit einer anderen Methode.",
  toastAccDeleted1: "Konto gelöscht",
  toastAccDeleted2: "Ihr Konto wurde erfolgreich gelöscht.",
  toastErrorDeleteExp:
    "Ausgabe konnte nicht gelöscht werden, bitte versuchen Sie es erneut!",
  toastErrorUpdateExp:
    "Ausgabe konnte nicht aktualisiert werden, bitte versuchen Sie es erneut!",
  toastErrorStoreExp:
    "Ausgabe konnte nicht gespeichert werden, bitte versuchen Sie es erneut!",
  toastSyncChanges1: "Synchronisiere Offline-Änderungen",
  toastSyncChanges2: "Bitte lassen Sie die App geöffnet...",
  toastSyncFinished1: "Wieder online!",
  toastSyncFinished21: "Synchronisiert",
  toastSyncFinished22: "Offline-Änderungen!",
};
const fr = {
  // standard strings
  signoutBtn: "Se déconnecter",
  signOutAlertTitle: "Annuler",
  signOutAlertMess: "Êtes-vous sûr(e) de vouloir vous déconnecter ?",
  confirm: "D'accord",
  confirm2: "Confirmer",
  continue: "Continuer",
  back: "Retour",
  cancel: "Annuler",
  delete: "Supprimer",
  saveChanges: "Enregistrer les modifications",
  add: "Ajouter",
  update: "Mettre à jour",
  sure: "Êtes-vous sûr(e) ?",
  sureExt: "Êtes-vous sûr(e) de vouloir supprimer cette dépense ?",
  resetBtn: "Réinitialiser le mot de passe",
  yes: "Oui",
  no: "Non",

  // Other Strings
  overview: "Aperçu",
  categories: "Catégories",
  invitationText: "J'ai une invitation d'un(e) autre voyageur(se) !",
  joinTrip: "Voulez-vous rejoindre le voyage ?",
  joinLink: "Vous pouvez coller votre lien d'invitation ici !",
  join: "Rejoindre",
  createFirstTrip: "Créer un premier voyage",
  myTrips: "Mes voyages",
  chooseAction: "Veuillez choisir une action :",
  inviteTravellers: "Inviter d'autres voyageurs",
  setActiveTrip: "Définir comme voyage actif",
  calcOpenSplits: "Calculer les dépenses partagées ouvertes",
  daily: "Quotidien",

  // today - yesterday etc.
  today: "Aujourd'hui",
  yesterday: "Hier",
  thisWeek: "Cette semaine",
  lastWeek: "La semaine dernière",
  thisMonth: "Ce mois-ci",
  lastMonth: "Le mois dernier",
  thisYear: "Cette année",
  lastYear: "L'année dernière",

  // last periodname
  last: "Dernier",
  days: "jours",
  weeks: "semaines",
  months: "mois",
  years: "années",

  // Category Names
  catFoodString: "Nourriture",
  catIntTravString: "Vols",
  catAccoString: "Hébergement",
  catNatTravString: "Transport",
  catOtherString: "Autre",
  catNewString: "Nouvelle catégorie",

  // Form Labels
  nameLabel: "Nom",
  priceIn: "Prix en ",
  showMoreOptions: "Afficher plus d'options",
  showLessOptions: "Afficher moins d'options",
  currencyLabel: "Devise",
  baseCurrency: "Devise d'origine",
  descriptionLabel: "Description",
  dateLabel: "Date",

  // Modal Titles
  editExp: "Modifier la dépense",
  addExp: "Ajouter une dépense",
  whoPaid: "Qui a payé ?",
  howShared: "Comment les coûts sont-ils partagés ?",
  whoShared: "Avec qui les coûts sont-ils partagés ?",
  paidSelf: "Payé pour soi-même",
  sharedEq: "Partagé également",
  sharedEx: "Partagé individuellement",

  // Dropdown Labels
  todayLabel: "Aujourd'hui",
  weekLabel: "Semaine",
  monthLabel: "Mois",
  yearLabel: "Année",
  totalLabel: "Total",

  // Error Messages
  fetchError: "Impossible de récupérer les dépenses de la base de données !",
  deleteError:
    "Impossible de supprimer la dépense - veuillez réessayer ultérieurement !",
  profileError:
    "Impossible d'enregistrer le profil - veuillez réessayer ultérieurement !",
  fallbackTextExpenses:
    "Aucune dépense pour cette période. Ajoutez de nouvelles dépenses avec le bouton ci-dessous !",
  fallbackTimeFrame: "Veuillez choisir une période dans la barre de sélection.",
  invalidInput:
    "Valeurs d'entrée invalides - veuillez vérifier les données entrées !",

  // Walkthrough Texts
  walk1:
    "Bienvenue sur Budget For Nomads! 🎉 Nous sommes ravis de vous accompagner dans votre parcours financier de voyage!",
  walk2:
    "Commençons par ajouter vos dépenses. 🛍️ Il suffit de cliquer sur le bouton '+' et de saisir les détails de votre dépense. Essayez dès maintenant!",
  walk3:
    "Suivez votre budget quotidiennement ou mensuellement. 📊 Utilisez le bouton pour changer de période et restez au top de vos dépenses! 🤑",
  walk4:
    "Consultez vos dépenses par catégorie ou par vue d'ensemble quotidienne. 📈 Utilisez le bouton pour basculer entre les deux et obtenir une vue détaillée de vos finances! 🤑",
  walk5:
    "Prêt pour votre prochaine aventure? 🌎 Créez un nouveau voyage et commencez à budgétiser pour vos voyages! 🧳",
  walk6:
    "Consultez tous vos voyages et suivez votre voyage actif. 🗺️ Votre voyage actif sera mis en évidence en vert. 🟢",
  walk7:
    "Invitez un ami à vous accompagner dans vos voyages! 👫 Invitez un autre nomade à rejoindre votre voyage actif et budgétisez ensemble. 💸",
  walk8:
    "Profitez de votre voyage avec Budget For Nomads! 🎉 Nous sommes là pour vous aider à rester dans votre budget tout en explorant le monde. 🌍",

  // Tabbar labels
  expensesTab: "Dépenses",
  overviewTab: "Vue d'ensemble",
  profileTab: "Profil",
  settingsTab: "Paramètres",

  // Settings Labels
  logoutLabel: "Déconnexion",
  joinTripLabel: "Rejoindre un voyage",
  simplifySplitsLabel: "Résumé des dettes",
  resetAppIntroductionLabel: "Réinitialiser l'introduction de l'application",
  visitFoodForNomadsLabel: "Visitez Food For Nomads",

  // Trip Form Labels
  tripFormTitleNew: "Nouveau budget de voyage",
  tripFormTitleEdit: "Modifier le budget de voyage",
  tripNameLabel: "Nom du voyage",
  baseCurrencyLabel: "Devise d'origine",
  totalBudgetLabel: "Budget total en",
  dailyBudgetLabel: "Budget quotidien en",
  enterNameAlert: "Veuillez entrer un nom pour votre nouveau budget de voyage",
  enterBudgetAlert:
    "Veuillez entrer un budget total supérieur au budget quotidien",
  selectCurrencyAlert:
    "Veuillez sélectionner une devise d'origine pour votre budget de voyage",
  deleteTrip: "Supprimer le voyage",
  deleteTripSure: "Êtes-vous sûr de vouloir supprimer ce voyage?",
  setActive: "Définir comme voyage actif",
  datePickerLabel: "Début et fin du voyage",

  // Loading Strings
  loadingYourTrip: "Chargement de votre voyage...",
  loading: "Chargement...",

  // Invite Screen
  inviteMessage:
    "Salut ! J'utilise Budget For Nomads pour planifier mon prochain voyage et je voulais t'inviter à me rejoindre. Avant de cliquer sur le lien ci-dessous, assure-toi d'avoir installé l'application. Une fois que c'est fait, il te suffit de cliquer sur le lien et de rejoindre notre voyage. Faisons de ce voyage inoubliable ensemble !",
  noTrip: "Impossible de trouver le voyage !",
  tryAgain: "Veuillez réessayer ultérieurement.",

  // Login and Signup Screen
  noConnection: "Pas de connexion internet",
  checkConnectionError:
    "Veuillez vérifier votre connexion internet et réessayer",
  exceptionError: "Erreur exceptionnelle",
  authError: "Authentification échouée!",
  createErrorText:
    "Impossible de créer l'utilisateur, veuillez vérifier vos informations et réessayer plus tard.",
  authErrorText:
    "Échec de la connexion. Mot de passe ou nom d'utilisateur incorrect ? Veuillez réessayer plus tard.",
  loginLoadText: "Connexion de l'utilisateur...",
  createUserLoadText: "Création de l'utilisateur...",
  noAccountText: "Vous n'avez pas de compte?",
  alreadyAccountText: "Vous avez déjà un compte?",
  createNewUser: "Créer un nouvel utilisateur",
  loginInstead: "Se connecter plutôt",
  loginText: "Se connecter",
  createAccountText: "Créer un compte",
  welcomeSigninText:
    "Bienvenue, connectez-vous pour continuer à utiliser l'application de suivi des dépenses",
  welcomeCreateAccountText:
    "Entrez vos identifiants ici ou inscrivez-vous facilement via Google.",
  emailLabel: "Adresse e-mail",
  passwordLabel: "Mot de passe",
  signupComingSoonAlert:
    "La fonctionnalité S'inscrire / Se connecter avec Google arrive bientôt... ",
  signupGoogleText: "S'inscrire avec Google",

  //Onboarding Screens
  onb1: "Voyagez avec style avec un petit budget",
  onb1t:
    "Optimisez votre budget de voyage sans sacrifier le confort ou les expériences.",
  onb2: "Simplifiez les dépenses de voyage en groupe",
  onb2t:
    "Répartissez et suivez facilement les coûts de voyage avec des amis et de la famille, et tirez le meilleur parti de votre budget.",
  onb3: "Atteignez vos objectifs financiers",
  onb3t:
    "Prenez le contrôle de vos finances et planifiez votre voyage de rêve avec les outils de budgétisation et de suivi de Budget for Nomads.",

  // Filtered expenses
  noExpensesText: "Aucune dépense -",

  // duplOrSplit
  duplicateExpensesText: " - dépenses dupliquées",
  splitUpExpensesText: " - dépenses partagées",
  rangedDatesTitle: "Dépenses à long terme",
  rangedDatesText:
    "Souhaitez-vous multiplier ou fractionner les coûts sur plusieurs jours ?",
  duplicateExpenses: "Dupliquer",
  splitUpExpenses: "Séparer",

  paywallTitle: "Devenez un Nomade Premium !",
  paywallSubtitle:
    "Facilitez votre voyage avec des fonctionnalités supplémentaires :",
  paywallFeature1: "✓ Créez vos propres catégories",
  paywallFeature2: "✓ Simplifiez le règlement des dettes",
  paywallFeature3:
    "✓ Gardez une meilleure vue d'ensemble avec des graphiques avancés",
  paywallFeature4: "✓ Recherchez des dépenses avec des options de filtrage",
  paywallFeature5: "✓ Demandez à ChatGPT si vous avez fait une bonne affaire",
  paywallFeature6:
    "Commencez votre essai gratuit d'une semaine dès maintenant.",
  paywallLegal1:
    "À la fin de la période d'essai d'une semaine, votre compte iTunes sera facturé 2 $. L'abonnement se renouvellera automatiquement sauf s'il est annulé dans les 24 heures précédant la fin de la période en cours. Vous pouvez annuler à tout moment via votre compte iTunes. Toute partie inutilisée de l'essai gratuit sera perdue lors de l'achat de l'abonnement. Pour plus d'informations, veuillez consulter nos conditions générales et notre politique de confidentialité.",
  paywallToS: "Conditions d'utilisation",
  paywallPP: "Politique de confidentialité",

  // auth form
  nameInvalidInfoText: "Veuillez entrer un nom !",
  emailInvalidInfoText: "Veuillez entrer une adresse e-mail valide !",
  passwordInvalidInfoText:
    "Veuillez entrer un mot de passe d'au moins 6 caractères !",

  // new stuff
  shareTripLabel: "Partager le voyage",
  tourGuideLabelPrevious: "Précédent",
  tourGuideLabelNext: "Suivant",
  tourGuideLabelSkip: "Passer",
  tourGuideLabelFinish: "Terminer",
  countryLabel: "Pays",
  askChatGptPost: "Demander à ChatGPT : Est-ce une bonne affaire ?",
  askChatGptPre:
    "Demander à ChatGPT : Est-ce que ce serait une bonne affaire ?",
  askChatGptTitle: "Demander à ChatGPT",
  askingChatGpt: "Demander à ChatGPT pour une bonne affaire...",
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Année",
  total: "Total",
  budget: "Budget",
  noTotalBudget: "Pas de budget total !",
  infinityLeftToSpend: "Il vous reste ∞ à dépenser !",
  youHaveXLeftToSpend1: "Il vous reste ",
  youHaveXLeftToSpend2: " à dépenser !",
  underBudget: "Sous le budget de",
  overBudget: "Au-dessus du budget de",
  exceededBudgetByX1: "Vous avez dépassé votre budget de ",
  slowConnection: "Connexion lente",
  megaBytePerSecond: "Mbps",
  offlineMode: "Mode hors ligne",
  notPaidLabel: "Pas encore payé",
  paidLabel: "Remboursé",
  travellers: "Voyageurs",
  countries: "Pays",
  currencies: "Devises",
  expenses: "Dépenses",
  welcomeToBudgetForNomads: "Bienvenue dans Budget for Nomads",
  pleaseCreateTrip: "Veuillez créer ou rejoindre un voyage pour commencer !",
  finderTitle: "Recherche",
  search: "Rechercher",
  finding: "Recherche en cours",
  showXResults1: "Afficher",
  showXResults2: "résultats",
  noResults: "Aucun résultat",
  splitSummaryTitle: "Résumé des dépenses",
  yourMoneyBack: "Votre argent est de retour",
  youStillOwe: "Vous devez toujours",
  error: "Erreur",
  errorSplits: "Impossible de récupérer les dépenses partagées !",
  alertNoSplits: "Aucune dépense à simplifier",
  XowesYtoZ1: "doit",
  XowesYtoZ2: "à",
  simplifySplits: "Simplifier les dépenses",
  settleSplits: "Régler les dépenses",
  confirmSettle: "Régler",
  sureSettleSplits:
    "Êtes-vous sûr de vouloir régler toutes les dépenses ? Tout le monde a-t-il récupéré son argent ?",
  sureDeleteAccount:
    "Cela supprimera définitivement votre compte Budget for Nomads !",
  premiumNomad: "Nomade Premium",
  premiumNomadActiveNow: "Vous êtes maintenant un nomade premium !",
  youArePremium: "Vous êtes un nomade Premium !",
  becomePremium: "Devenir un nomade Premium !",
  premiumNomadInactive: "Vous n'êtes pas encore un nomade Premium !",
  premiumNomadError:
    "Une erreur s'est produite, impossible d'activer le nomade premium !",
  settingsTitle: "Paramètres",
  restorePurchases: "Restaurer les achats",
  deleteAccount: "Supprimer le compte",
  settingsSkipCat: "Passer la sélection de catégorie",
  settingsShowAdvanced: "Toujours afficher plus d'options",
  settingsShowFlags: "Afficher les icônes de drapeau",
  settingsShowInternetSpeed: "Afficher la vitesse d'Internet",
  settingsShowTravellerIcon: "Afficher les icônes de voyageur",
  newCatNamePlaceholder: "Entrez le nouveau nom de catégorie...",
  reset: "Réinitialiser",
  sureResetCategories:
    "Êtes-vous sûr de vouloir réinitialiser vos catégories ?",
  infoNewCatTitle: "Informations sur la nouvelle catégorie",
  infoNewCatText:
    "Entrez un nom pour votre catégorie, puis appuyez sur le symbole de votre nouvelle catégorie." +
    "\n\n Confirmez votre nouvelle catégorie avec le bouton <Ajouter>.",
  infoHomeCurrencyTitle: "Informations sur la devise locale",
  infoHomeCurrencyText:
    "Configurez ici votre devise locale (par exemple, la devise du pays dans lequel vous résidez)." +
    "\n\n Le pays ne sera pas enregistré et est seulement utile pour trouver votre devise." +
    "\n\n Cette devise sera affichée dans l'application et toutes les autres devises que vous utiliserez lors de votre voyage seront converties en celle-ci.",
  infoTotalBudgetTitle: "Informations sur le budget total",
  infoTotalBudgetText:
    "Configurez ici votre budget total (par exemple, le montant d'argent pour l'ensemble du voyage)." +
    "\n\n Vous pouvez appuyer sur le bouton de calcul pour auto-calculer le budget total à partir du budget quotidien * dates de début et de fin du voyage." +
    "\n\n Le budget total est facultatif.",
  infoDailyBudgetTitle: "Informations sur le budget quotidien",
  infoDailyBudgetText:
    "Configurez ici votre budget quotidien (par exemple, le montant moyen d'argent à dépenser par jour)." +
    "Si vous ne savez pas exactement combien vous souhaitez dépenser, indiquez simplement une estimation." +
    "\n\n Vous pouvez appuyer sur le bouton de calcul pour auto-calculer le budget quotidien à partir du budget total / dates de début et de fin du voyage.",
  infoTripDatesTitle: "Informations sur les dates de début et de fin du voyage",
  infoTripDatesText:
    "Configurez ici les dates de début et de fin de votre voyage (par exemple, les dates de votre voyage)." +
    "\n\n Le début et la fin du voyage sont facultatifs.",
  comingSoon: "Bientôt disponible...",
  comingSoonRangedDates:
    "Il n'est pas encore possible de modifier les dates des dépenses avec une plage de dates.",
  comingSoonDuplOrSplit:
    "Il n'est pas encore possible de modifier la répartition des dépenses avec une plage de dates.",
  sorry: "Désolé !",
  sorrySplitList:
    "Je n'ai pas pu calculer une répartition valide. Veuillez vérifier vos données. \n\n Vous pouvez également appuyer longuement sur le bouton de recalcul pour réinitialiser toutes les répartitions !",
  errorPurchasePackage: "Erreur lors de l'achat du package",
  errorPurchasePackageText:
    "Veuillez redémarrer l'application ou réessayer ultérieurement.",
  errorGetOffers: "Erreur lors de l'obtention des offres",
  errorGetOffersText:
    "Veuillez redémarrer l'application ou réessayer ultérieurement.",
  errorShareTrip: "Erreur lors du partage du voyage",
  errorShareTripText:
    "Veuillez redémarrer l'application ou réessayer ultérieurement.",
  inviteTraveller: "Inviter un autre voyageur",
  toastLoginError1: "Erreur de connexion",
  toastLoginError2: "Veuillez vous connecter à nouveau !",
  toastAccountError1: "Compte introuvable",
  toastAccountError2: "Veuillez d'abord créer un nouveau compte !",
  toastEmailError1: "Aucun e-mail trouvé",
  toastEmailError2: "Veuillez réessayer avec une méthode différente.",
  toastAppleError1: "Erreur de connexion Apple",
  toastAppleError2: "L'utilisateur a annulé le processus de connexion",
  toastDeleting1: "Suppression",
  toastDeleting2: "Veuillez laisser l'application ouverte...",
  error2: "Veuillez réessayer ultérieurement.",
  toastSaving1: "Enregistrement des modifications",
  toastSaving2: "Veuillez laisser l'application ouverte...",
  toastPurchaseSuccess1: "Achat réussi",
  toastPurchaseSuccess2: "Vous êtes maintenant membre Premium Nomad",
  toastPremiumFetchError: "Erreur lors de la récupération du statut premium",
  toastSavingError1: "Impossible d'enregistrer les données",
  toastNameError1: "Aucun nom trouvé",
  toastNameError2:
    "Il pourrait y avoir un problème avec le processus de connexion Apple. Veuillez réessayer avec une méthode différente.",
  toastAccDeleted1: "Compte supprimé",
  toastAccDeleted2: "Votre compte a été supprimé avec succès.",
  toastErrorDeleteExp:
    "Impossible de supprimer la dépense, veuillez réessayer !",
  toastErrorUpdateExp:
    "Impossible de mettre à jour la dépense, veuillez réessayer !",
  toastErrorStoreExp:
    "Impossible d'enregistrer la dépense, veuillez réessayer !",
  toastSyncChanges1: "Synchronisation des modifications hors ligne",
  toastSyncChanges2: "Veuillez laisser l'application ouverte...",
  toastSyncFinished1: "En ligne à nouveau !",
  toastSyncFinished21: "Synchronisé",
  toastSyncFinished22: "modifications hors ligne !",
};
const ru = {
  // standard strings
  signoutBtn: "Выйти",
  signOutAlertTitle: "Отменить",
  signOutAlertMess: "Вы уверены, что хотите выйти?",
  confirm: "Окей",
  confirm2: "Подтвердить",
  continue: "Продолжить",
  back: "Назад",
  cancel: "Отмена",
  delete: "Удалить",
  saveChanges: "Сохранить изменения",
  add: "Добавить",
  update: "Обновить",
  sure: "Вы уверены?",
  sureExt: "Вы уверены, что хотите удалить эту статью расходов?",
  resetBtn: "Сбросить пароль",
  yes: "Да",
  no: "Нет",

  // Other Strings
  overview: "Обзор",
  categories: "Категории",
  invitationText: "У меня есть приглашение от другого путешественника!",
  joinTrip: "Хотите присоединиться к поездке?",
  joinLink: "Вы можете вставить ссылку на ваше приглашение здесь!",
  join: "Присоединиться",
  createFirstTrip: "Создать первую поездку",
  myTrips: "Мои поездки",
  chooseAction: "Пожалуйста, выберите действие:",
  inviteTravellers: "Пригласить других путешественников",
  setActiveTrip: "Установить активную поездку",
  calcOpenSplits: "Рассчитать открытые распределения",
  daily: "Ежедневно",

  // today - yesterday etc.
  today: "Сегодня",
  yesterday: "Вчера",
  thisWeek: "На этой неделе",
  lastWeek: "На прошлой неделе",
  thisMonth: "В этом месяце",
  lastMonth: "В прошлом месяце",
  thisYear: "В этом году",
  lastYear: "В прошлом году",

  // last periodname
  last: "Последние",
  days: "дни",
  weeks: "недели",
  months: "месяцы",
  years: "годы",

  // Category Names
  catFoodString: "Еда",
  catIntTravString: "Полеты",
  catAccoString: "Проживание",
  catNatTravString: "Транспорт",
  catOtherString: "Другое",
  catNewString: "Новая категория",

  // Form Labels
  nameLabel: "Имя",
  priceIn: "Цена в ",
  showMoreOptions: "Показать больше опций",
  showLessOptions: "Показать меньше опций",
  currencyLabel: "Валюта",
  baseCurrency: "Домашняя валюта",
  descriptionLabel: "Описание",
  dateLabel: "Дата",

  // Modal Titles
  editExp: "Изменить статью расходов",
  addExp: "Добавить статью расходов",
  whoPaid: "Кто заплатил?",
  howShared: "Как распределены расходы?",
  whoShared: "Кто участвует в распределении расходов?",
  paidSelf: "Оплачено самостоятельно",
  sharedEq: "Равномерное распределение",
  sharedEx: "Индивидуальное распределение",

  // Dropdown Labels
  todayLabel: "Сегодня",
  weekLabel: "Неделя",
  monthLabel: "Месяц",
  yearLabel: "Год",
  totalLabel: "Всего",

  // Error Messages
  fetchError: "Не удалось получить данные о расходах из базы данных! ",
  deleteError:
    "Не удалось удалить статью расходов - пожалуйста, попробуйте позже!",
  profileError: "Не удалось сохранить профиль - пожалуйста, попробуйте позже!",
  fallbackTextExpenses:
    "Нет расходов за указанный период. Добавьте новые расходы с помощью кнопки ниже!",
  fallbackTimeFrame: "Пожалуйста, выберите период времени в панели выбора.",
  invalidInput: "Неверные значения - пожалуйста, проверьте введенные данные!",

  // Walkthrough Texts
  walk1:
    "Добро пожаловать в Budget for Nomads! 🎉 Мы рады приветствовать вас в вашем финансовом путешествии!",
  walk2:
    "Начните с добавления своих расходов. 🛍️ Просто нажмите кнопку '+' и введите детали вашего расхода. Давайте попробуем сейчас!",
  walk3:
    "Отслеживайте свой бюджет ежедневно или ежемесячно. 📊 Используйте кнопку для переключения между временными периодами и следите за своими расходами! 🤑",
  walk4:
    "Просматривайте свои расходы по категориям или общему обзору за день. 📈 Используйте переключатель, чтобы переключаться между ними и получить подробный вид своих финансов! 🤑",
  walk5:
    "Готовы к следующему приключению? 🌎 Создайте новую поездку и начните планировать бюджет для своих путешествий! 🧳",
  walk6:
    "Просмотрите все свои поездки и отслеживайте активную. 🗺️ Ваша активная поездка будет выделена зеленым цветом. 🟢",
  walk7:
    "Пригласите друга в свои путешествия! 👫 Пригласите другого путешественника в вашу активную поездку и планируйте бюджет вместе. 💸",
  walk8:
    "Наслаждайтесь путешествием с Budget for Nomads! 🎉 Мы здесь, чтобы помочь вам оставаться в рамках бюджета, пока вы исследуете мир. 🌍",

  // Tabbar labels
  expensesTab: "Расходы",
  overviewTab: "Обзор",
  profileTab: "Профиль",
  settingsTab: "Настройки",

  // Settings Labels
  logoutLabel: "Выйти",
  joinTripLabel: "Присоединиться к поездке",
  simplifySplitsLabel: "Открыть сводку распределения",
  resetAppIntroductionLabel: "Сбросить введение в приложение",
  visitFoodForNomadsLabel: "Посетить Food For Nomads",

  // Trip Form Labels
  tripFormTitleNew: "Бюджет новой поездки",
  tripFormTitleEdit: "Изменить бюджет поездки",
  tripNameLabel: "Название поездки",
  baseCurrencyLabel: "Домашняя валюта",
  totalBudgetLabel: "Общий бюджет в",
  dailyBudgetLabel: "Дневной бюджет в",
  enterNameAlert: "Введите название нового бюджета поездки",
  enterBudgetAlert: "Введите общий бюджет, превышающий дневной бюджет",
  selectCurrencyAlert: "Выберите базовую валюту для бюджета поездки",
  deleteTrip: "Удалить поездку",
  deleteTripSure: "Вы уверены, что хотите удалить эту поездку?",
  setActive: "Установить активной поездкой",
  datePickerLabel: "Начало и окончание поездки",

  // Loading Strings
  loadingYourTrip: "Загрузка вашей поездки...",
  loading: "Загрузка...",

  // Invite Screen
  inviteMessage:
    "Привет! Я использую Budget For Nomads для планирования моей следующей поездки и хотел пригласить вас присоединиться ко мне. Прежде чем нажать на ссылку ниже, убедитесь, что установили приложение. Как только закончите, просто нажмите ссылку и присоединяйтесь к нашей поездке. Давайте вместе сделаем эту поездку незабываемой!",
  noTrip: "Не удалось найти поездку!",
  tryAgain: "Пожалуйста, попробуйте еще раз позже.",

  // Login and Signup Screen
  noConnection: "Отсутствует подключение к интернету",
  checkConnectionError:
    "Пожалуйста, проверьте ваше интернет-соединение и попробуйте еще раз",
  exceptionError: "Исключительная ошибка",
  authError: "Ошибка аутентификации!",
  createErrorText:
    "Не удалось создать пользователя, пожалуйста, проверьте введенные данные и попробуйте еще раз позже.",
  authErrorText:
    "Не удалось войти. Неверный пароль или имя пользователя? Пожалуйста, попробуйте еще раз позже.",
  loginLoadText: "Вход пользователя...",
  createUserLoadText: "Создание пользователя...",
  noAccountText: "У вас нет аккаунта?",
  alreadyAccountText: "У вас уже есть аккаунт?",
  createNewUser: "Создать нового пользователя",
  loginInstead: "Войти вместо этого",
  loginText: "Вход",
  createAccountText: "Создать аккаунт",
  welcomeSigninText:
    "Добро пожаловать, войдите, чтобы продолжить использование Expense Tracker",
  welcomeCreateAccountText:
    "Введите свои учетные данные здесь или зарегистрируйтесь легко через Google.",
  emailLabel: "Адрес электронной почты",
  passwordLabel: "Пароль",
  signupComingSoonAlert:
    "Функция регистрации / входа через Google скоро будет доступна...",
  signupGoogleText: "Зарегистрироваться с помощью Google",

  // Onboarding Screens
  onb1: "Путешествуйте стильно с ограниченным бюджетом",
  onb1t:
    "Максимизируйте свой бюджет для путешествий, не жертвуя комфортом и впечатлениями.",
  onb2: "Упрощение расходов в групповых поездках",
  onb2t:
    "Легко разделите и отслеживайте расходы на путешествия с друзьями и семьей, чтобы максимально использовать свой бюджет.",
  onb3: "Достигайте финансовых целей",
  onb3t:
    "Управляйте своими финансами и планируйте свою мечту поездки с помощью инструментов для бюджетирования и отслеживания Budget for Nomads.",

  // Filtered expenses
  noExpensesText: "Нет расходов -",
  duplicateExpensesText: " - повторяющиеся расходы",
  splitUpExpensesText: " - разделенные расходы",

  // duplOrSplitUp
  rangedDatesTitle: "Долгосрочные расходы",
  rangedDatesText: "Хотите умножить или разделить затраты на несколько дней?",
  duplicateExpenses: "Дублировать",
  splitUpExpenses: "Разделить",

  paywallTitle: "Станьте Премиум-Номадом!",
  paywallSubtitle: "Упростите свое путешествие с дополнительными функциями:",
  paywallFeature1: "✓ Создавайте собственные категории,",
  paywallFeature2: "✓ Упрощайте расчеты по долгам,",
  paywallFeature3:
    "✓ Поддерживайте лучший обзор с помощью расширенных графиков,",
  paywallFeature4: "✓ Ищите расходы с помощью функций фильтрации,",
  paywallFeature5: "✓ Спросите у ChatGPT, получили ли вы хорошую сделку,",
  paywallFeature6: "Начните пробный период на 1 неделю сейчас,",
  paywallLegal1:
    "По истечении 1-недельного пробного периода ваш аккаунт iTunes будет списан на $2. Подписка автоматически продлится, если не будет отменена в течение 24 часов перед окончанием текущего периода. Вы можете отменить подписку в любое время через свой аккаунт iTunes. Любая неиспользованная часть бесплатного пробного периода будет аннулирована при покупке подписки. Дополнительную информацию можно найти в наших условиях использования и политике конфиденциальности.",
  paywallToS: "Условия использования",
  paywallPP: "Политика конфиденциальности",
  // auth form
  nameInvalidInfoText: "Пожалуйста, введите имя!",
  emailInvalidInfoText:
    "Пожалуйста, введите действительный адрес электронной почты!",
  passwordInvalidInfoText:
    "Пожалуйста, введите пароль длиной не менее 6 символов!",
  shareTripLabel: "Поделиться поездкой",
  tourGuideLabelPrevious: "Предыдущий",
  tourGuideLabelNext: "Следующий",
  tourGuideLabelSkip: "Пропустить",
  tourGuideLabelFinish: "Завершить",
  countryLabel: "Страна",
  askChatGptPost: "Спросить у ChatGPT: Это хорошая сделка?",
  askChatGptPre: "Спросить у ChatGPT: Будет ли это хорошая сделка?",
  askChatGptTitle: "Спросить у ChatGPT",
  askingChatGpt: "Запрашиваю мнение ChatGPT о хорошей сделке...",
  day: "День",
  week: "Неделя",
  month: "Месяц",
  year: "Год",
  total: "Всего",
  budget: "Бюджет",
  noTotalBudget: "Нет общего бюджета!",
  infinityLeftToSpend: "У вас осталось ∞ для траты!",
  youHaveXLeftToSpend1: "У вас осталось ",
  youHaveXLeftToSpend2: " для траты!",
  underBudget: "Меньше бюджета на",
  overBudget: "Больше бюджета на",
  exceededBudgetByX1: "Вы превысили бюджет на ",
  slowConnection: "Медленное подключение",
  megaBytePerSecond: "Мб/с",
  offlineMode: "Офлайн режим",
  notPaidLabel: "Еще не оплачено",
  paidLabel: "Оплачено",
  travellers: "Путешественники",
  countries: "Страны",
  currencies: "Валюты",
  expenses: "Расходы",
  welcomeToBudgetForNomads: "Добро пожаловать в Budget for Nomads",
  pleaseCreateTrip:
    "Пожалуйста, создайте или присоединитесь к поездке, чтобы начать!",
  finderTitle: "Поиск",
  search: "Поиск",
  finding: "Поиск",
  showXResults1: "Показать",
  showXResults2: "результаты",
  noResults: "Нет результатов",
  splitSummaryTitle: "Разделить сумму",
  yourMoneyBack: "Ваши деньги вернутся",
  youStillOwe: "Вы все еще должны",
  error: "Ошибка",
  errorSplits: "Не удалось получить разделы!",
  alertNoSplits: "Нет разделов для упрощения",
  XowesYtoZ1: "должен",
  XowesYtoZ2: "для",
  simplifySplits: "Упростить разделы",
  settleSplits: "Расчет разделов",
  confirmSettle: "Расчет",
  sureSettleSplits:
    "Вы уверены, что хотите рассчитать все разделы? Все ли получили свои деньги?",
  sureDeleteAccount: "Это безвозвратно удалит ваш аккаунт в Budget for Nomads!",
  premiumNomad: "Премиум-намбад",
  premiumNomadActiveNow: "Теперь вы являетесь премиум-намбадом!",
  youArePremium: "Вы являетесь премиум-намбадом!",
  becomePremium: "Станьте премиум-намбадом!",
  premiumNomadInactive: "Вы еще не являетесь премиум-намбадом!",
  premiumNomadError:
    "Что-то пошло не так, не удалось активировать премиум-намбад!",
  settingsTitle: "Настройки",
  restorePurchases: "Восстановить покупки",
  deleteAccount: "Удалить аккаунт",
  settingsSkipCat: "Пропустить выбор категории",
  settingsShowAdvanced: "Всегда показывать дополнительные опции",
  settingsShowFlags: "Показывать значки флагов",
  settingsShowInternetSpeed: "Показывать скорость интернета",
  settingsShowTravellerIcon: "Показывать значки путешественников",
  // new Stuff part 2
  newCatNamePlaceholder: "Введите название новой категории...",
  reset: "Сбросить",
  sureResetCategories: "Вы уверены, что хотите сбросить свои категории?",
  infoNewCatTitle: "Информация о новой категории",
  infoNewCatText:
    "Введите название для вашей категории, а затем нажмите символ для вашей новой категории." +
    "\n\n Подтвердите вашу новую категорию кнопкой <Добавить>.",
  infoHomeCurrencyTitle: "Информация о домашней валюте",
  infoHomeCurrencyText:
    "Установите здесь вашу домашнюю валюту (например, валюту страны, в которой вы живете)." +
    "\n\n Страна не будет сохранена и используется только для поиска вашей валюты." +
    "\n\n Эта валюта будет отображаться в приложении, и все остальные валюты, которые вы используете во время путешествия, будут конвертироваться в эту.",
  infoTotalBudgetTitle: "Информация об общем бюджете",
  infoTotalBudgetText:
    "Настройте ваш общий бюджет здесь (например, сумму денег на весь путешествие)." +
    '\n\n Вы можете нажать кнопку "Рассчитать" для автоматического расчета общего бюджета на основе ежедневного бюджета * даты начала и окончания путешествия.' +
    "\n\n Общий бюджет является необязательным.",

  infoDailyBudgetTitle: "Информация о ежедневном бюджете",
  infoDailyBudgetText:
    "Настройте ваш ежедневный бюджет здесь (например, среднюю сумму денег, которую вы планируете тратить в день)." +
    "Если вы не знаете точно, сколько вы хотите потратить, просто укажите приблизительную сумму." +
    '\n\n Вы можете нажать кнопку "Рассчитать" для автоматического расчета ежедневного бюджета на основе общего бюджета / даты начала и окончания путешествия.',

  infoTripDatesTitle: "Информация о датах начала и окончания путешествия",
  infoTripDatesText:
    "Настройте даты начала и окончания путешествия здесь (например, даты вашего путешествия)." +
    "\n\n Даты начала и окончания путешествия являются необязательными.",

  comingSoon: "Скоро появится...",

  comingSoonRangedDates:
    "Изменение дат расходов с диапазоном дат пока невозможно.",

  comingSoonDuplOrSplit:
    "Изменение разделения расходов с диапазоном дат пока невозможно.",

  sorry: "Извините!",

  sorrySplitList:
    'Не удалось рассчитать допустимое разделение. Пожалуйста, проверьте введенные данные. \n\n Также вы можете долго нажать кнопку "Пересчитать", чтобы сбросить все разделения!',

  errorPurchasePackage: "Ошибка при покупке пакета",

  errorPurchasePackageText:
    "Пожалуйста, перезапустите приложение или попробуйте позже.",

  errorGetOffers: "Ошибка при получении предложений",

  errorGetOffersText:
    "Пожалуйста, перезапустите приложение или попробуйте позже.",

  errorShareTrip: "Ошибка при передаче путешествия",
  errorShareTripText:
    "Пожалуйста, перезапустите приложение или попробуйте позже.",
  inviteTraveller: "Пригласить другого путешественника",
  toastLoginError1: "Ошибка входа",
  toastLoginError2: "Пожалуйста, войдите снова!",
  toastAccountError1: "Аккаунт не найден",
  toastAccountError2: "Пожалуйста, создайте новый аккаунт!",
  toastEmailError1: "Email не найден",
  toastEmailError2: "Пожалуйста, попробуйте еще раз с другим методом.",
  toastAppleError1: "Ошибка входа через Apple",
  toastAppleError2: "Пользователь отменил процесс входа",
  toastDeleting1: "Удаление",
  toastDeleting2: "Пожалуйста, не закрывайте приложение...",
  error2: "Пожалуйста, попробуйте позже.",
  toastSaving1: "Сохранение изменений",
  toastSaving2: "Пожалуйста, не закрывайте приложение...",
  toastPurchaseSuccess1: "Покупка успешна",
  toastPurchaseSuccess2: "Теперь вы являетесь премиум-пользователем Nomad",
  toastPremiumFetchError: "Ошибка получения статуса премиума",
  toastSavingError1: "Не удалось сохранить данные",
  toastNameError1: "Имя не найдено",
  toastNameError2:
    "Возможна проблема с процессом входа через Apple. Пожалуйста, попробуйте еще раз с другим методом.",
  toastAccDeleted1: "Аккаунт удален",
  toastAccDeleted2: "Ваш аккаунт успешно удален.",
  toastErrorDeleteExp:
    "Не удалось удалить расход, пожалуйста, попробуйте снова!",
  toastErrorUpdateExp:
    "Не удалось обновить расход, пожалуйста, попробуйте снова!",
  toastErrorStoreExp:
    "Не удалось сохранить расход, пожалуйста, попробуйте снова!",
  toastSyncChanges1: "Синхронизация офлайн изменений",
  toastSyncChanges2: "Пожалуйста, не закрывайте приложение...",
  toastSyncFinished1: "Снова онлайн!",
  toastSyncFinished21: "Синхронизированы",
  toastSyncFinished22: "офлайн изменения!",
};
export { en, de, fr, ru };
