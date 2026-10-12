import {create} from "zustand"
import { getBiometricEnabled, setBiometricEnabled } from "@/lib/biometric"
import i18n, { getSavedLanguage, saveLanguage, type Language } from "@/lib/i18n"

interface UserStore {
    currency: string;
    setCurrency: (value: string) => void;
    needsOnboarding: boolean | null; // null = not yet determined
    setNeedsOnboarding: (value: boolean | null) => void;

    language: Language
    hydrateLanguage: () => Promise<void>
    setLanguage: (language: Language ) => Promise<void>

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

    language: (i18n.language as Language) ?? "en",

    hydrateLanguage: async () => {
        const saved = await getSavedLanguage()
        await i18n.changeLanguage(saved)
        set({ language: saved})
    },

    setLanguage: async (language) => {
        await saveLanguage(language)
        await i18n.changeLanguage(language)
        set({ language})
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