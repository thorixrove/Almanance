export const formatPrice = (value: number, currency: string = "IDR"): string => {
    const locale = currency === "IDR" ? "id-ID" : undefined

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Mengubah teks angka yang diketik pengguna menjadi number.
 * Menerima format Indonesia ("1.500.000", "1.500,50") maupun
 * format internasional ("1,500,000", "1,500.50", "1500.5").
 * Mengembalikan NaN kalau tidak bisa dibaca.
 *
 * Aturan:
 * - Kalau ada titik DAN koma, yang muncul paling akhir adalah desimal.
 * - Kalau hanya satu jenis pemisah dan muncul lebih dari sekali,
 *   itu pemisah ribuan ("1.500.000").
 * - Kalau hanya satu jenis pemisah dan muncul sekali: tepat 3 digit
 *   setelahnya dianggap ribuan ("1.500" = 1500), selain itu desimal
 *   ("1,5" = 1.5).
 */
export const parseAmount = (input: string): number => {
    const cleaned = input.replace(/[\s\u00A0]/g, "")
    if (!/^\d[\d.,]*$/.test(cleaned)) return NaN

    const lastDot = cleaned.lastIndexOf(".")
    const lastComma = cleaned.lastIndexOf(",")
    const dotCount = (cleaned.match(/\./g) ?? []).length
    const commaCount = (cleaned.match(/,/g) ?? []).length

    let normalized: string

    if (lastDot !== -1 && lastComma !== -1) {
        // Dua jenis pemisah: yang paling akhir adalah desimal.
        const decimalSep = lastDot > lastComma ? "." : ","
        const thousandSep = decimalSep === "." ? "," : "."
        normalized = cleaned
            .split(thousandSep).join("")
            .replace(decimalSep, ".")
    } else if (lastDot !== -1 || lastComma !== -1) {
        const sep = lastDot !== -1 ? "." : ","
        const count = sep === "." ? dotCount : commaCount
        const lastIndex = sep === "." ? lastDot : lastComma
        const digitsAfter = cleaned.length - lastIndex - 1

        if (count > 1 || digitsAfter === 3) {
            normalized = cleaned.split(sep).join("")
        } else {
            normalized = cleaned.replace(sep, ".")
        }
    } else {
        normalized = cleaned
    }

    const result = Number(normalized)
    return Number.isFinite(result) ? result : NaN
}