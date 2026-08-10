export const formatPrice = (value: number, currency: string = "IDR"): string => {
    const locale = currency === "IDR" ? "en-IN" : undefined

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}