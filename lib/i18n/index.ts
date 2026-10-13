import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as SecureStore from "expo-secure-store"
import en from "./locales/en"
import id from "./locales/id"

export type Language = "en" | "id"

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
]

const LANGUAGE_KEY = "app_language"

// Bahasa perangkat, tanpa native module tambahan (tidak perlu rebuild).
function getDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale
    return locale.toLowerCase().startsWith("id") ? "id" : "en"
  } catch {
    return "en"
  }
}

export async function getSavedLanguage(): Promise<Language> {
  try {
    const value = await SecureStore.getItemAsync(LANGUAGE_KEY)
    if (value === "id" || value === "en") return value
  } catch {
    // abaikan, pakai bahasa perangkat
  }
  return getDeviceLanguage()
}

export async function saveLanguage(language: Language): Promise<void> {
  await SecureStore.setItemAsync(LANGUAGE_KEY, language)
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    id: { translation: id },
  },
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n