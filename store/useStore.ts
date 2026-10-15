import {create} from "zustand"
import { getBiometricEnabled, setBiometricEnabled } from "@/lib/biometric"
import i18n, {
    getSavedLanguagePreference,
    resolveLanguage,
    saveLanguagePreference,
    type Language,
    type LanguagePreference,
} from "@/lib/i18n"
import { applyThemeMode, getSavedThemeMode, saveThemeMode, type ThemeMode } from "@/lib/theme"

interface UserStore {
    currency: string;
    setCurrency: (value: string) => void;
    needsOnboarding: boolean | null; // null = not yet determined
    setNeedsOnboarding: (value: boolean | null) => void;

    themeMode: ThemeMode
    hydrateTheme: () => Promise<void>
    setThemeMode: (mode: ThemeMode) => Promise<void>

    language: Language
    languagePreference: LanguagePreference
    hydrateLanguage: () => Promise<void>
    setLanguage: (preference: LanguagePreference) => Promise<void>

    biometricEnabled: boolean | null
    isLocked: boolean
    hydrateBiometric: () => Promise<void>
    setBiometricLock: (enabled: boolean) => Promise<void>
    lock: () => void
    unlock: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
    currency: "IDR",
    setCurrency: (value) => set({ currency: value }),
    needsOnboarding: null,
    setNeedsOnboarding: (value) => set({ needsOnboarding: value }),

    themeMode: "system",

    hydrateTheme: async () => {
        const saved = await getSavedThemeMode()
        applyThemeMode(saved)
        set({themeMode: saved})
    },

    setThemeMode: async (mode) => {
        applyThemeMode(mode)
        set({ themeMode: mode})
        await saveThemeMode(mode)
    },

    language: (i18n.language as Language) ?? "en",
    languagePreference: "system",

    hydrateLanguage: async () => {
        const preference = await getSavedLanguagePreference()
        const resolved = resolveLanguage(preference)
        await i18n.changeLanguage(resolved)
        set({ language: resolved, languagePreference: preference})
    },

    setLanguage: async (preference) => {
        const resolved = resolveLanguage(preference)
        await saveLanguagePreference(preference)
        await i18n.changeLanguage(resolved)
        set({ language: resolved, languagePreference: preference})
    },

    biometricEnabled: null,
    isLocked: false,

    hydrateBiometric: async () => {
        const enabled = await getBiometricEnabled()
        set({ biometricEnabled: enabled, isLocked: enabled})
    },

    setBiometricLock: async (enabled) => {
        await setBiometricEnabled(enabled)
        set({ biometricEnabled: enabled, isLocked: false})
    },

    lock: () => {
        if (get().biometricEnabled) set({ isLocked: true})
    },
    unlock: () => set({ isLocked: false})
}))