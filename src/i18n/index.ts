import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { hi } from "./locales/hi";
import { kn } from "./locales/kn";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "HI" },
  { code: "kn", label: "ಕನ್ನಡ", short: "KN" },
] as const;

export const LANG_STORAGE_KEY = "rozgaar:lang";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, hi: { translation: hi }, kn: { translation: kn } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export function getStoredLanguage(): string {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  return LANGUAGES.some((l) => l.code === stored) ? (stored as string) : "en";
}

export function setLanguage(code: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_STORAGE_KEY, code);
  void i18n.changeLanguage(code);
}

export default i18n;
