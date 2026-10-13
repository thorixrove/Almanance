import { palettes, type ThemeColors, type ThemeScheme } from "@/lib/theme/palettes"
import { StatusBar } from "expo-status-bar"
import { vars } from "nativewind"
import { type ReactNode } from "react"
import { useColorScheme, View } from "react-native"

function hexToRgb(hex: string) {
    const n = parseInt(hex.slice(1), 16)
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const CSS_VAR_NAMES: Record<keyof ThemeColors, string> = {
    page: "--color-page",
    card: "--color-card",
    line: "--color-line",
    lineSoft: "--color-line-soft",
    ink: "--color-ink",
    subtle: "--color-subtle",
    solid: "--color-solid",
    onSolid: "--color-on-solid",
    hero: "--color-hero",
    icon: "--color-icon",
}

function buildVars(scheme: ThemeScheme) {
    const palette = palettes[scheme]
    const entries = Object.entries(CSS_VAR_NAMES).map(([key, cssVar]) => [
        cssVar,
        hexToRgb(palette[key as keyof ThemeColors],)
    ])
    return vars(Object.fromEntries(entries))
}

const themeVars = {
    light: buildVars("light"),
    dark: buildVars("dark"),
}

export function useThemeScheme(): ThemeScheme {
    return useColorScheme() === "dark" ? "dark" : "light"
}

export function useThemeColors(): ThemeColors {
    const scheme = useThemeScheme()
    return palettes[scheme] as ThemeColors
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const scheme = useThemeScheme()
    return (
        <View
            style={[{ flex: 1, backgroundColor: palettes[scheme].page }, themeVars[scheme]]}
        >
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            {children}
        </View>
    )
}