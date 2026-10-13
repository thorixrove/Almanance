import * as SecureStore from "expo-secure-store"
import { Appearance } from "react-native"
 
export type ThemeMode = "system" | "light" | "dark"
 
export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"]
 
const THEME_KEY = "app_theme"

export function applyThemeMode(mode: ThemeMode) {
    Appearance.setColorScheme(mode === "system" ? null : mode)
}

export async function getSavedThemeMode(): Promise<ThemeMode> {
    try {
        const value = await SecureStore.getItemAsync(THEME_KEY)
        if (value === "light" || value === "dark" || value === "system") return value
    } catch {
        
    }
    return "system"
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
    await SecureStore.setItemAsync(THEME_KEY, mode)
}