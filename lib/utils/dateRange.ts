import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    isSameDay,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns"
import i18n from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/dateLocale"

export type DateRangePreset =
    | "ALL"
    | "THIS_WEEK"
    | "THIS_MONTH"
    | "LAST_MONTH"
    | "CUSTOM"

export type DateRange = {
    preset: DateRangePreset
    from: Date | null
    to: Date | null
}

export const ALL_TIME: DateRange = { preset: "ALL", from: null, to: null }

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

export const PRESET_OPTIONS: { key: DateRangePreset; labelKey: string }[] = [
    { key: "ALL", labelKey: "dateRange.all" },
    { key: "THIS_WEEK", labelKey: "dateRange.thisWeek" },
    { key: "THIS_MONTH", labelKey: "dateRange.thisMonth" },
    { key: "LAST_MONTH", labelKey: "dateRange.lastMonth" },
    { key: "CUSTOM", labelKey: "dateRange.custom" },
]

export function getPresetRange(
    preset: Exclude<DateRangePreset, "CUSTOM">,
    now: Date = new Date()
): DateRange {
    switch (preset) {
        case "THIS_WEEK":
            return {
                preset,
                from: startOfWeek(now, WEEK_OPTIONS),
                to: endOfDay(now),
            }
        case "THIS_MONTH":
            return { preset, from: startOfMonth(now), to: endOfDay(now) }
        case "LAST_MONTH": {
            const last = subMonths(now, 1)
            return { preset, from: startOfMonth(last), to: endOfMonth(last) }
        }
        case "ALL":
        default:
            return ALL_TIME
    }
}

export function getCustomRange(from: Date, to: Date): DateRange {
    const [start, end] = from <= to ? [from, to] : [to, from]
    return { preset: "CUSTOM", from: startOfDay(start), to: endOfDay(end) }
}

export function toFilterDates(range: DateRange) {
    return {
        dateFrom: range.from ? range.from.toISOString() : null,
        dateTo: range.to ? range.to?.toISOString() : null,
    }
}

export function formatRangeLabel(range: DateRange) {
    const option = PRESET_OPTIONS.find((o) => o.key === range.preset)
    if (range.preset !== "CUSTOM" || !range.from || !range.to) {
        return i18n.t(option?.labelKey ?? "dateRange.all")
    }
    if (isSameDay(range.from, range.to)) return formatDate(range.from, "d MMM yyyy")
    const sameYear = range.from.getFullYear() === range.to.getFullYear()
    return `${formatDate(range.from, sameYear ? "d MMM" : "d MMM yyyy")} – ${formatDate(
        range.to,
        "d MMM yyyy"
    )}`
}