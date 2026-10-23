import { formatDate } from "@/lib/i18n/dateLocale"
import { DateRange } from "@/lib/utils/dateRange"
import {
    differenceInCalendarDays,
    eachDayOfInterval,
    eachMonthOfInterval,
    format,
    startOfDay,
    startOfMonth,
} from "date-fns"

const MAX_DAILY_BARS = 62

function dayKey(date: Date) {
    return format(date, "yyyy-MM-dd")
}

function monthKey(date: Date) {
    return format(date, "yyyy-MM")
}

export function buildChartBuckets(range: DateRange) {
    const today = startOfDay(new Date())
    const from = range.from && range.to ? startOfDay(range.from) : startOfMonth(today)
    const rawTo = range.from && range.to ? startOfDay(range.to) : today
    const to = rawTo > today ? today : rawTo

    if (from > to) {
        return { monthly: false, keyof: dayKey, buckets: [] as { key: string; label: string }[] }
    }

    if (differenceInCalendarDays(to, from) + 1 > MAX_DAILY_BARS) {
        return {
            monthly: true,
            keyof: monthKey,
            buckets: eachMonthOfInterval({ start: from, end: to }).map((d) => ({
                key: monthKey(d),
                label: formatDate(d, "MMM yy"),
            }))
        }
    }

    return {
        monthly: false,
        keyof: dayKey,
        buckets: eachDayOfInterval({ start: from, end: to}).map((d) => ({
            key: dayKey(d),
            label: formatDate(d, "d MMM"),
        })),
    }
}