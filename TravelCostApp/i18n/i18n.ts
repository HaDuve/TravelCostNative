import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "./supportedLanguages";

const i18n = new I18n({ en, de, fr, ru });

i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";

i18n.enableFallback = true;

export { i18n };

