// Token warna semantik. Dipakai lewat class Tailwind (bg-page, text-ink, ...)
// dan lewat useThemeColors() untuk prop yang butuh hex (ikon, placeholder, dll).
export type ThemeScheme = "light" | "dark"

export const palettes = {
  light: {
    page: "#F5F4F0", // latar halaman (dulu bg-brand-body)
    card: "#FFFFFF", // kartu/input/sheet (dulu bg-white)
    line: "#E8E6DF", // border (dulu border-[#E8E6DF])
    lineSoft: "#F0EDE6", // pemisah halus
    ink: "#0B0E14", // teks utama (dulu text-brand-bg)
    subtle: "#8A8D96", // teks sekunder (dulu text-brand-text-secondary)
    solid: "#0B0E14", // latar tombol utama (dulu bg-brand-bg)
    onSolid: "#FFFFFF", // teks di atas tombol utama (dulu text-white)
    hero: "#0B0E14", // kartu gelap berteks putih (kartu user di Profile)
    icon: "#5C5F68", // warna ikon
  },
  dark: {
    page: "#0B0E14",
    card: "#151924",
    line: "#262B3A",
    lineSoft: "#1E2230",
    ink: "#F2EFE9",
    subtle: "#9AA0AC",
    solid: "#F2EFE9",
    onSolid: "#0B0E14",
    hero: "#1A1F2C",
    icon: "#9AA0AC",
  },
} as const satisfies Record<ThemeScheme, Record<string, string>>

export type ThemeColors = (typeof palettes)["light"]