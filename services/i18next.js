import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import az from "../locales/az.json";

export const languageResources = {
    en: {translation: en},
    az: {translation: az}
}

i18next.use(initReactI18next).init({
  resources: languageResources,
  compatibilityJSON: 'v4',
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
