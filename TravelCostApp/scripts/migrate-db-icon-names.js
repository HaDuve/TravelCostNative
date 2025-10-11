const axios = require("axios");

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

// Icon name mapping for Ionicons v6+
const ICON_NAME_MAPPING = {
  // Remove ios- prefixes
  "ios-trash-outline": "trash-outline",
  "ios-checkmark-circle": "checkmark-circle",
  "ios-git-compare-outline": "git-compare-outline",
  "ios-earth": "globe-outline",
  "ios-arrow-undo-outline": "arrow-undo-outline",
  "ios-add": "add",
  "ios-add-circle": "add-circle",
  "ios-add-circle-outline": "add-circle-outline",
  "ios-airplane": "airplane",
  "ios-airplane-outline": "airplane-outline",
  "ios-alarm": "alarm",
  "ios-albums": "albums",
  "ios-alert": "alert",
  "ios-american-football": "american-football",
  "ios-analytics": "analytics",
  "ios-aperture": "aperture",
  "ios-apps": "apps",
  "ios-appstore": "appstore",
  "ios-archive": "archive",
  "ios-arrow-back": "arrow-back",
  "ios-arrow-down": "arrow-down",
  "ios-arrow-dropdown": "arrow-dropdown",
  "ios-arrow-forward": "arrow-forward",
  "ios-arrow-round-back": "arrow-round-back",
  "ios-arrow-round-down": "arrow-round-down",
  "ios-arrow-round-forward": "arrow-round-forward",
  "ios-arrow-round-up": "arrow-round-up",
  "ios-arrow-up": "arrow-up",
  "ios-at": "at",
  "ios-attach": "attach",
  "ios-backspace": "backspace",
  "ios-barcode": "barcode",
  "ios-baseball": "baseball",
  "ios-basket": "basket",
  "ios-basketball": "basketball",
  "ios-battery-charging": "battery-charging",
  "ios-battery-dead": "battery-dead",
  "ios-battery-full": "battery-full",
  "ios-beaker": "beaker",
  "ios-bed": "bed",
  "ios-beer": "beer",
  "ios-bicycle": "bicycle",
  "ios-bluetooth": "bluetooth",
  "ios-boat": "boat",
  "ios-body": "body",
  "ios-bonfire": "bonfire",
  "ios-book": "book",
  "ios-bookmark": "bookmark",
  "ios-bookmarks": "bookmarks",
  "ios-bowtie": "bowtie",
  "ios-briefcase": "briefcase",
  "ios-browsers": "browsers",
  "ios-brush": "brush",
  "ios-bug": "bug",
  "ios-build": "build",
  "ios-bulb": "bulb",
  "ios-bus": "bus",
  "ios-business": "business",
  "ios-cafe": "cafe",
  "ios-calculator": "calculator",
  "ios-calendar": "calendar",
  "ios-call": "call",
  "ios-camera": "camera",
  "ios-car": "car",
  "ios-card": "card",
  "ios-cart": "cart",
  "ios-cash": "cash",
  "ios-cellular": "cellular",
  "ios-chatboxes": "chatboxes",
  "ios-chatbubbles": "chatbubbles",
  "ios-checkbox": "checkbox",
  "ios-checkmark": "checkmark",
  "ios-clipboard": "clipboard",
  "ios-clock": "clock",
  "ios-close": "close",
  "ios-cloud": "cloud",
  "ios-cloud-circle": "cloud-circle",
  "ios-cloud-done": "cloud-done",
  "ios-cloud-download": "cloud-download",
  "ios-cloud-outline": "cloud-outline",
  "ios-cloud-upload": "cloud-upload",
  "ios-cloudy": "cloudy",
  "ios-code": "code",
  "ios-code-download": "code-download",
  "ios-code-working": "code-working",
  "ios-cog": "cog",
  "ios-color-fill": "color-fill",
  "ios-color-filter": "color-filter",
  "ios-color-palette": "color-palette",
  "ios-color-wand": "color-wand",
  "ios-compass": "compass",
  "ios-construct": "construct",
  "ios-contact": "contact",
  "ios-contacts": "contacts",
  "ios-contract": "contract",
  "ios-contrast": "contrast",
  "ios-copy": "copy",
  "ios-create": "create",
  "ios-crop": "crop",
  "ios-cube": "cube",
  "ios-cut": "cut",
  "ios-desktop": "desktop",
  "ios-disc": "disc",
  "ios-document": "document",
  "ios-done-all": "done-all",
  "ios-download": "download",
  "ios-easel": "easel",
  "ios-egg": "egg",
  "ios-exit": "exit",
  "ios-expand": "expand",
  "ios-eye": "eye",
  "ios-eye-off": "eye-off",
  "ios-fastforward": "fastforward",
  "ios-female": "female",
  "ios-filing": "filing",
  "ios-film": "film",
  "ios-finger-print": "finger-print",
  "ios-fitness": "fitness",
  "ios-flag": "flag",
  "ios-flame": "flame",
  "ios-flash": "flash",
  "ios-flash-off": "flash-off",
  "ios-flashlight": "flashlight",
  "ios-flask": "flask",
  "ios-flower": "flower",
  "ios-folder": "folder",
  "ios-folder-open": "folder-open",
  "ios-football": "football",
  "ios-funnel": "funnel",
  "ios-gift": "gift",
  "ios-git-branch": "git-branch",
  "ios-git-commit": "git-commit",
  "ios-git-merge": "git-merge",
  "ios-git-network": "git-network",
  "ios-git-pull-request": "git-pull-request",
  "ios-glasses": "glasses",
  "ios-globe": "globe",
  "ios-grid": "grid",
  "ios-hammer": "hammer",
  "ios-hand": "hand",
  "ios-happy": "happy",
  "ios-headset": "headset",
  "ios-heart": "heart",
  "ios-heart-dislike": "heart-dislike",
  "ios-heart-empty": "heart-empty",
  "ios-heart-half": "heart-half",
  "ios-help": "help",
  "ios-help-buoy": "help-buoy",
  "ios-help-circle": "help-circle",
  "ios-help-circle-outline": "help-circle-outline",
  "ios-home": "home",
  "ios-hourglass": "hourglass",
  "ios-ice-cream": "ice-cream",
  "ios-image": "image",
  "ios-images": "images",
  "ios-infinite": "infinite",
  "ios-information": "information",
  "ios-information-circle": "information-circle",
  "ios-information-circle-outline": "information-circle-outline",
  "ios-jet": "jet",
  "ios-journal": "journal",
  "ios-key": "key",
  "ios-keypad": "keypad",
  "ios-laptop": "laptop",
  "ios-leaf": "leaf",
  "ios-link": "link",
  "ios-list": "list",
  "ios-list-box": "list-box",
  "ios-locate": "locate",
  "ios-lock": "lock",
  "ios-log-in": "log-in",
  "ios-log-out": "log-out",
  "ios-magnet": "magnet",
  "ios-mail": "mail",
  "ios-mail-open": "mail-open",
  "ios-mail-unread": "mail-unread",
  "ios-male": "male",
  "ios-man": "man",
  "ios-map": "map",
  "ios-medal": "medal",
  "ios-medical": "medical",
  "ios-medkit": "medkit",
  "ios-megaphone": "megaphone",
  "ios-menu": "menu",
  "ios-mic": "mic",
  "ios-mic-off": "mic-off",
  "ios-microphone": "microphone",
  "ios-moon": "moon",
  "ios-more": "more",
  "ios-move": "move",
  "ios-musical-note": "musical-note",
  "ios-musical-notes": "musical-notes",
  "ios-navigate": "navigate",
  "ios-notifications": "notifications",
  "ios-notifications-off": "notifications-off",
  "ios-notifications-outline": "notifications-outline",
  "ios-nuclear": "nuclear",
  "ios-nutrition": "nutrition",
  "ios-open": "open",
  "ios-options": "options",
  "ios-outlet": "outlet",
  "ios-paper": "paper",
  "ios-paper-plane": "paper-plane",
  "ios-partly-sunny": "partly-sunny",
  "ios-pause": "pause",
  "ios-paw": "paw",
  "ios-people": "people",
  "ios-person": "person",
  "ios-person-add": "person-add",
  "ios-phone-landscape": "phone-landscape",
  "ios-phone-portrait": "phone-portrait",
  "ios-photos": "photos",
  "ios-pie": "pie",
  "ios-pin": "pin",
  "ios-pint": "pint",
  "ios-pizza": "pizza",
  "ios-planet": "planet",
  "ios-play": "play",
  "ios-play-circle": "play-circle",
  "ios-podium": "podium",
  "ios-power": "power",
  "ios-pricetag": "pricetag",
  "ios-pricetags": "pricetags",
  "ios-print": "print",
  "ios-pulse": "pulse",
  "ios-qr-scanner": "qr-scanner",
  "ios-quote": "quote",
  "ios-radio": "radio",
  "ios-radio-button-off": "radio-button-off",
  "ios-radio-button-on": "radio-button-on",
  "ios-rainy": "rainy",
  "ios-recording": "recording",
  "ios-redo": "redo",
  "ios-refresh": "refresh",
  "ios-refresh-circle": "refresh-circle",
  "ios-remove": "remove",
  "ios-remove-circle": "remove-circle",
  "ios-remove-circle-outline": "remove-circle-outline",
  "ios-reorder": "reorder",
  "ios-repeat": "repeat",
  "ios-resize": "resize",
  "ios-restaurant": "restaurant",
  "ios-return-left": "return-left",
  "ios-return-right": "return-right",
  "ios-reverse-camera": "reverse-camera",
  "ios-rewind": "rewind",
  "ios-ribbon": "ribbon",
  "ios-rocket": "rocket",
  "ios-rose": "rose",
  "ios-sad": "sad",
  "ios-save": "save",
  "ios-school": "school",
  "ios-search": "search",
  "ios-send": "send",
  "ios-settings": "settings",
  "ios-share": "share",
  "ios-share-alt": "share-alt",
  "ios-shirt": "shirt",
  "ios-shuffle": "shuffle",
  "ios-skip-backward": "skip-backward",
  "ios-skip-forward": "skip-forward",
  "ios-snow": "snow",
  "ios-speedometer": "speedometer",
  "ios-square": "square",
  "ios-square-outline": "square-outline",
  "ios-star": "star",
  "ios-star-half": "star-half",
  "ios-star-outline": "star-outline",
  "ios-stats": "stats",
  "ios-stopwatch": "stopwatch",
  "ios-subway": "subway",
  "ios-sunny": "sunny",
  "ios-swap": "swap",
  "ios-switch": "switch",
  "ios-sync": "sync",
  "ios-tablet-landscape": "tablet-landscape",
  "ios-tablet-portrait": "tablet-portrait",
  "ios-tennisball": "tennisball",
  "ios-text": "text",
  "ios-thermometer": "thermometer",
  "ios-thumbs-down": "thumbs-down",
  "ios-thumbs-up": "thumbs-up",
  "ios-thunderstorm": "thunderstorm",
  "ios-time": "time",
  "ios-timer": "timer",
  "ios-today": "today",
  "ios-train": "train",
  "ios-transgender": "transgender",
  "ios-trash": "trash",
  "ios-trending-down": "trending-down",
  "ios-trending-up": "trending-up",
  "ios-trophy": "trophy",
  "ios-tv": "tv",
  "ios-umbrella": "umbrella",
  "ios-undo": "undo",
  "ios-unlock": "unlock",
  "ios-videocam": "videocam",
  "ios-volume-high": "volume-high",
  "ios-volume-low": "volume-low",
  "ios-volume-mute": "volume-mute",
  "ios-volume-off": "volume-off",
  "ios-walk": "walk",
  "ios-wallet": "wallet",
  "ios-warning": "warning",
  "ios-watch": "watch",
  "ios-water": "water",
  "ios-wifi": "wifi",
  "ios-wine": "wine",
  "ios-woman": "woman",

  // Remove md- prefixes
  "md-arrow-undo-outline": "arrow-undo-outline",
  "md-git-compare-outline": "git-compare-outline",
  "md-add": "add",
  "md-add-circle": "add-circle",
  "md-alarm": "alarm",
  "md-albums": "albums",
  "md-alert": "alert",
  "md-american-football": "american-football",
  "md-analytics": "analytics",
  "md-aperture": "aperture",
  "md-apps": "apps",
  "md-appstore": "appstore",
  "md-archive": "archive",
  "md-arrow-back": "arrow-back",
  "md-arrow-down": "arrow-down",
  "md-arrow-dropdown": "arrow-dropdown",
  "md-arrow-forward": "arrow-forward",
  "md-arrow-round-back": "arrow-round-back",
  "md-arrow-round-down": "arrow-round-down",
  "md-arrow-round-forward": "arrow-round-forward",
  "md-arrow-round-up": "arrow-round-up",
  "md-arrow-up": "arrow-up",
  "md-at": "at",
  "md-attach": "attach",
  "md-backspace": "backspace",
  "md-barcode": "barcode",
  "md-baseball": "baseball",
  "md-basket": "basket",
  "md-basketball": "basketball",
  "md-battery-charging": "battery-charging",
  "md-battery-dead": "battery-dead",
  "md-battery-full": "battery-full",
  "md-beaker": "beaker",
  "md-bed": "bed",
  "md-beer": "beer",
  "md-bicycle": "bicycle",
  "md-bluetooth": "bluetooth",
  "md-boat": "boat",
  "md-body": "body",
  "md-bonfire": "bonfire",
  "md-book": "book",
  "md-bookmark": "bookmark",
  "md-bookmarks": "bookmarks",
  "md-bowtie": "bowtie",
  "md-briefcase": "briefcase",
  "md-browsers": "browsers",
  "md-brush": "brush",
  "md-bug": "bug",
  "md-build": "build",
  "md-bulb": "bulb",
  "md-bus": "bus",
  "md-business": "business",
  "md-cafe": "cafe",
  "md-calculator": "calculator",
  "md-calendar": "calendar",
  "md-call": "call",
  "md-camera": "camera",
  "md-car": "car",
  "md-card": "card",
  "md-cart": "cart",
  "md-cash": "cash",
  "md-cellular": "cellular",
  "md-chatboxes": "chatboxes",
  "md-chatbubbles": "chatbubbles",
  "md-checkbox": "checkbox",
  "md-checkmark": "checkmark",
  "md-clipboard": "clipboard",
  "md-clock": "clock",
  "md-close": "close",
  "md-cloud": "cloud",
  "md-cloud-circle": "cloud-circle",
  "md-cloud-done": "cloud-done",
  "md-cloud-download": "cloud-download",
  "md-cloud-outline": "cloud-outline",
  "md-cloud-upload": "cloud-upload",
  "md-cloudy": "cloudy",
  "md-code": "code",
  "md-code-download": "code-download",
  "md-code-working": "code-working",
  "md-cog": "cog",
  "md-color-fill": "color-fill",
  "md-color-filter": "color-filter",
  "md-color-palette": "color-palette",
  "md-color-wand": "color-wand",
  "md-compass": "compass",
  "md-construct": "construct",
  "md-contact": "contact",
  "md-contacts": "contacts",
  "md-contract": "contract",
  "md-contrast": "contrast",
  "md-copy": "copy",
  "md-create": "create",
  "md-crop": "crop",
  "md-cube": "cube",
  "md-cut": "cut",
  "md-desktop": "desktop",
  "md-disc": "disc",
  "md-document": "document",
  "md-done-all": "done-all",
  "md-download": "download",
  "md-easel": "easel",
  "md-egg": "egg",
  "md-exit": "exit",
  "md-expand": "expand",
  "md-eye": "eye",
  "md-eye-off": "eye-off",
  "md-fastforward": "fastforward",
  "md-female": "female",
  "md-filing": "filing",
  "md-film": "film",
  "md-finger-print": "finger-print",
  "md-fitness": "fitness",
  "md-flag": "flag",
  "md-flame": "flame",
  "md-flash": "flash",
  "md-flash-off": "flash-off",
  "md-flashlight": "flashlight",
  "md-flask": "flask",
  "md-flower": "flower",
  "md-folder": "folder",
  "md-folder-open": "folder-open",
  "md-football": "football",
  "md-funnel": "funnel",
  "md-gift": "gift",
  "md-git-branch": "git-branch",
  "md-git-commit": "git-commit",
  "md-git-merge": "git-merge",
  "md-git-network": "git-network",
  "md-git-pull-request": "git-pull-request",
  "md-glasses": "glasses",
  "md-globe": "globe",
  "md-grid": "grid",
  "md-hammer": "hammer",
  "md-hand": "hand",
  "md-happy": "happy",
  "md-headset": "headset",
  "md-heart": "heart",
  "md-heart-dislike": "heart-dislike",
  "md-heart-empty": "heart-empty",
  "md-heart-half": "heart-half",
  "md-help": "help",
  "md-help-buoy": "help-buoy",
  "md-help-circle": "help-circle",
  "md-help-circle-outline": "help-circle-outline",
  "md-home": "home",
  "md-hourglass": "hourglass",
  "md-ice-cream": "ice-cream",
  "md-image": "image",
  "md-images": "images",
  "md-infinite": "infinite",
  "md-information": "information",
  "md-information-circle": "information-circle",
  "md-information-circle-outline": "information-circle-outline",
  "md-jet": "jet",
  "md-journal": "journal",
  "md-key": "key",
  "md-keypad": "keypad",
  "md-laptop": "laptop",
  "md-leaf": "leaf",
  "md-link": "link",
  "md-list": "list",
  "md-list-box": "list-box",
  "md-locate": "locate",
  "md-lock": "lock",
  "md-log-in": "log-in",
  "md-log-out": "log-out",
  "md-magnet": "magnet",
  "md-mail": "mail",
  "md-mail-open": "mail-open",
  "md-mail-unread": "mail-unread",
  "md-male": "male",
  "md-man": "man",
  "md-map": "map",
  "md-medal": "medal",
  "md-medical": "medical",
  "md-medkit": "medkit",
  "md-megaphone": "megaphone",
  "md-menu": "menu",
  "md-mic": "mic",
  "md-mic-off": "mic-off",
  "md-microphone": "microphone",
  "md-moon": "moon",
  "md-more": "more",
  "md-move": "move",
  "md-musical-note": "musical-note",
  "md-musical-notes": "musical-notes",
  "md-navigate": "navigate",
  "md-notifications": "notifications",
  "md-notifications-off": "notifications-off",
  "md-notifications-outline": "notifications-outline",
  "md-nuclear": "nuclear",
  "md-nutrition": "nutrition",
  "md-open": "open",
  "md-options": "options",
  "md-outlet": "outlet",
  "md-paper": "paper",
  "md-paper-plane": "paper-plane",
  "md-partly-sunny": "partly-sunny",
  "md-pause": "pause",
  "md-paw": "paw",
  "md-people": "people",
  "md-person": "person",
  "md-person-add": "person-add",
  "md-phone-landscape": "phone-landscape",
  "md-phone-portrait": "phone-portrait",
  "md-photos": "photos",
  "md-pie": "pie",
  "md-pin": "pin",
  "md-pint": "pint",
  "md-pizza": "pizza",
  "md-planet": "planet",
  "md-play": "play",
  "md-play-circle": "play-circle",
  "md-podium": "podium",
  "md-power": "power",
  "md-pricetag": "pricetag",
  "md-pricetags": "pricetags",
  "md-print": "print",
  "md-pulse": "pulse",
  "md-qr-scanner": "qr-scanner",
  "md-quote": "quote",
  "md-radio": "radio",
  "md-radio-button-off": "radio-button-off",
  "md-radio-button-on": "radio-button-on",
  "md-rainy": "rainy",
  "md-recording": "recording",
  "md-redo": "redo",
  "md-refresh": "refresh",
  "md-refresh-circle": "refresh-circle",
  "md-remove": "remove",
  "md-remove-circle": "remove-circle",
  "md-remove-circle-outline": "remove-circle-outline",
  "md-reorder": "reorder",
  "md-repeat": "repeat",
  "md-resize": "resize",
  "md-restaurant": "restaurant",
  "md-return-left": "return-left",
  "md-return-right": "return-right",
  "md-reverse-camera": "reverse-camera",
  "md-rewind": "rewind",
  "md-ribbon": "ribbon",
  "md-rocket": "rocket",
  "md-rose": "rose",
  "md-sad": "sad",
  "md-save": "save",
  "md-school": "school",
  "md-search": "search",
  "md-send": "send",
  "md-settings": "settings",
  "md-share": "share",
  "md-share-alt": "share-alt",
  "md-shirt": "shirt",
  "md-shuffle": "shuffle",
  "md-skip-backward": "skip-backward",
  "md-skip-forward": "skip-forward",
  "md-snow": "snow",
  "md-speedometer": "speedometer",
  "md-square": "square",
  "md-square-outline": "square-outline",
  "md-star": "star",
  "md-star-half": "star-half",
  "md-star-outline": "star-outline",
  "md-stats": "stats",
  "md-stopwatch": "stopwatch",
  "md-subway": "subway",
  "md-sunny": "sunny",
  "md-swap": "swap",
  "md-switch": "switch",
  "md-sync": "sync",
  "md-tablet-landscape": "tablet-landscape",
  "md-tablet-portrait": "tablet-portrait",
  "md-tennisball": "tennisball",
  "md-text": "text",
  "md-thermometer": "thermometer",
  "md-thumbs-down": "thumbs-down",
  "md-thumbs-up": "thumbs-up",
  "md-thunderstorm": "thunderstorm",
  "md-time": "time",
  "md-timer": "timer",
  "md-today": "today",
  "md-train": "train",
  "md-transgender": "transgender",
  "md-trash": "trash",
  "md-trending-down": "trending-down",
  "md-trending-up": "trending-up",
  "md-trophy": "trophy",
  "md-tv": "tv",
  "md-umbrella": "umbrella",
  "md-undo": "undo",
  "md-unlock": "unlock",
  "md-videocam": "videocam",
  "md-volume-high": "volume-high",
  "md-volume-low": "volume-low",
  "md-volume-mute": "volume-mute",
  "md-volume-off": "volume-off",
  "md-walk": "walk",
  "md-wallet": "wallet",
  "md-warning": "warning",
  "md-watch": "watch",
  "md-water": "water",
  "md-wifi": "wifi",
  "md-wine": "wine",
  "md-woman": "woman",

  // Keep these unchanged (for reference)
  "document-outline": "document-outline",
  "pie-chart-outline": "pie-chart-outline",
  "close-outline": "close-outline",
  "checkmark-done-outline": "checkmark-done-outline",
  "ellipsis-horizontal-circle-outline": "ellipsis-horizontal-circle-outline"
};

// You'll need to get a valid auth token - replace this with your actual token
const AUTH_TOKEN = "YOUR_FIREBASE_AUTH_TOKEN_HERE";

class IconNameDBMigration {
  constructor(options = {}) {
    this.stats = {
      totalTrips: 0,
      totalUsers: 0,
      totalCategories: 0,
      updatedCategories: 0,
      skippedCategories: 0,
      errors: [],
    };

    this.options = {
      dryRun: false,
      batchSize: 10,
      delayMs: 100,
      ...options,
    };
  }

  async run() {
    console.log("🚀 Starting Database Icon Name Migration...");
    console.log("=".repeat(50));

    if (this.options.dryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made");
    }

    if (this.options.tripId) {
      console.log(`🎯 Targeting specific trip: ${this.options.tripId}`);
    }

    try {
      if (!AUTH_TOKEN || AUTH_TOKEN === "YOUR_FIREBASE_AUTH_TOKEN_HERE") {
        throw new Error("Please set a valid AUTH_TOKEN in the script");
      }

      // Get trips to process
      const trips = this.options.tripId
        ? [this.options.tripId]
        : await this.getAllTrips();
      console.log(`📊 Found ${trips.length} trip(s) to process`);

      // Process each trip
      for (const tripId of trips) {
        await this.processTrip(tripId);
      }

      // Print final statistics
      this.printStats();
    } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  }

  async getAllTrips() {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/trips.json?auth=${AUTH_TOKEN}`,
        { timeout: 30000 }
      );

      const trips = response.data;
      if (!trips) return [];

      return Object.keys(trips);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      throw error;
    }
  }

  async processTrip(tripId) {
    console.log(`\n🏷️  Processing trip: ${tripId}`);

    try {
      // Verify trip exists
      const response = await axios.get(
        `${BACKEND_URL}/trips/${tripId}.json?auth=${AUTH_TOKEN}`,
        { timeout: 30000 }
      );

      const tripData = response.data;
      if (!tripData) {
        console.log(`⚠️  Trip ${tripId} not found or empty`);
        return;
      }

      this.stats.totalTrips++;

      // Process categories in the trip data
      if (tripData.categories) {
        await this.processTripCategories(tripId, tripData.categories);
      }

      // Process each user's categories in the trip
      for (const [uid, userData] of Object.entries(tripData)) {
        if (userData && userData.categories) {
          await this.processUserCategories(tripId, uid, userData.categories);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process trip ${tripId}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  async processTripCategories(tripId, categories) {
    console.log(`  📁 Processing trip categories`);
    let categoryList;

    try {
      // Categories might be stored as a stringified array
      categoryList =
        typeof categories === "string" ? JSON.parse(categories) : categories;
    } catch (error) {
      console.log(`    ⚠️  Invalid category data format`);
      return;
    }

    if (!Array.isArray(categoryList)) {
      console.log(`    ⚠️  Categories is not an array`);
      return;
    }

    this.stats.totalCategories += categoryList.length;
    let updatedCategories = false;

    // Process each category
    for (const category of categoryList) {
      if (category.icon && ICON_NAME_MAPPING.hasOwnProperty(category.icon)) {
        const oldIcon = category.icon;
        const newIcon = ICON_NAME_MAPPING[oldIcon];

        if (this.options.dryRun) {
          console.log(
            `    🔍 [DRY RUN] Would update category icon from ${oldIcon} to ${newIcon}`
          );
          this.stats.updatedCategories++;
          updatedCategories = true;
        } else {
          category.icon = newIcon;
          this.stats.updatedCategories++;
          updatedCategories = true;
          console.log(
            `    ✅ Updated category icon from ${oldIcon} to ${newIcon}`
          );
        }
      } else {
        this.stats.skippedCategories++;
      }
    }

    // Update the trip's categories if changes were made
    if (updatedCategories && !this.options.dryRun) {
      const updatedCategoriesString = JSON.stringify(categoryList);
      await axios.patch(
        `${BACKEND_URL}/trips/${tripId}.json?auth=${AUTH_TOKEN}`,
        { categories: updatedCategoriesString },
        { timeout: 10000 }
      );
      console.log(`    💾 Saved updated categories to trip`);
    }
  }

  async processUserCategories(tripId, uid, categories) {
    console.log(`  👤 Processing user categories for: ${uid}`);
    this.stats.totalUsers++;

    let categoryList;
    try {
      categoryList =
        typeof categories === "string" ? JSON.parse(categories) : categories;
    } catch (error) {
      console.log(`    ⚠️  Invalid category data format`);
      return;
    }

    if (!Array.isArray(categoryList)) {
      console.log(`    ⚠️  Categories is not an array`);
      return;
    }

    this.stats.totalCategories += categoryList.length;
    let updatedCategories = false;

    // Process categories in batches
    const batches = this.chunkArray(categoryList, this.options.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `    📦 Processing batch ${i + 1}/${batches.length} (${batch.length} categories)`
      );

      for (const category of batch) {
        if (category.icon && ICON_NAME_MAPPING.hasOwnProperty(category.icon)) {
          const oldIcon = category.icon;
          const newIcon = ICON_NAME_MAPPING[oldIcon];

          if (this.options.dryRun) {
            console.log(
              `    🔍 [DRY RUN] Would update category icon from ${oldIcon} to ${newIcon}`
            );
            this.stats.updatedCategories++;
            updatedCategories = true;
          } else {
            category.icon = newIcon;
            this.stats.updatedCategories++;
            updatedCategories = true;
            console.log(
              `    ✅ Updated category icon from ${oldIcon} to ${newIcon}`
            );
          }
        } else {
          this.stats.skippedCategories++;
        }
      }

      // Add delay between batches
      if (i < batches.length - 1) {
        await this.delay(this.options.delayMs);
      }
    }

    // Update the user's categories if changes were made
    if (updatedCategories && !this.options.dryRun) {
      const updatedCategoriesString = JSON.stringify(categoryList);
      await axios.patch(
        `${BACKEND_URL}/trips/${tripId}/${uid}.json?auth=${AUTH_TOKEN}`,
        { categories: updatedCategoriesString },
        { timeout: 10000 }
      );
      console.log(`    💾 Saved updated categories to user`);
    }
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printStats() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION COMPLETE - FINAL STATISTICS");
    console.log("=".repeat(50));
    console.log(`🏷️  Total Trips Processed: ${this.stats.totalTrips}`);
    console.log(`👤 Total Users Processed: ${this.stats.totalUsers}`);
    console.log(`📝 Total Categories Found: ${this.stats.totalCategories}`);
    console.log(`✅ Categories Updated: ${this.stats.updatedCategories}`);
    console.log(`⏭️  Categories Skipped: ${this.stats.skippedCategories}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log("\n🚨 ERRORS ENCOUNTERED:");
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.options.dryRun) {
      console.log("\n🔍 This was a DRY RUN - no actual changes were made");
    } else {
      console.log("\n🎉 Migration completed successfully!");
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--trip-id":
      case "-t":
        options.tripId = args[i + 1];
        i++; // Skip next argument as it's the value
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--batch-size":
      case "-b":
        options.batchSize = parseInt(args[i + 1], 10);
        i++; // Skip next argument as it's the value
        break;
      case "--delay":
        options.delayMs = parseInt(args[i + 1], 10);
        i++; // Skip next argument as it's the value
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🚀 Database Icon Name Migration Script

USAGE:
  node scripts/migrate-db-icon-names.js [OPTIONS]

OPTIONS:
  -t, --trip-id <id>     Run migration on specific trip ID only
  -d, --dry-run          Preview changes without making them
  -b, --batch-size <n>   Number of categories to process in parallel (default: 10)
  --delay <ms>           Delay between batches in milliseconds (default: 100)
  -h, --help            Show this help message

EXAMPLES:
  # Run on all trips (dry run)
  node scripts/migrate-db-icon-names.js --dry-run

  # Run on specific trip
  node scripts/migrate-db-icon-names.js --trip-id "trip123"

  # Run with custom batch size and delay
  node scripts/migrate-db-icon-names.js --batch-size 5 --delay 200

NOTES:
  - Make sure to set AUTH_TOKEN in the script before running
  - Consider running with --dry-run first to preview changes
  - The script processes categories in batches to avoid rate limiting
  - Both trip-level and user-level categories are updated
`);
}

// Run the migration
async function main() {
  const options = parseArgs();
  const migration = new IconNameDBMigration(options);
  await migration.run();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
