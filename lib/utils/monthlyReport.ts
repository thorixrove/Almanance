import type { CategoryKey } from "@/constants/categories"
import type {
    CategoryComparison,
    MonthlyReport,
    ReportDelta,
    Transaction,
} from "@/types"
import { endOfMonth, isSameMonth, startOfMonth, subMonths } from "date-fns"


export function getReportQueryRange(month: Date) {
    return {
        dateFrom: startOfMonth(subMonths(month, 1)).toISOString(),
        dateTo: endOfMonth(month).toISOString(),
    }
}

function makeDelta(current: number, previous: number): ReportDelta {
    const diff = current - previous
    return {
        current,
        previous,
        diff,
        percent: previous > 0 ? (diff / previous) * 100 : null,
    }
}

export function buildMonthlyReport(
    transactions: Transaction[],
    month: Date
): MonthlyReport {
    const previousMonth = subMonths(month, 1)
    const current = new Map<CategoryKey, number>()
    const previous = new Map<CategoryKey, number>()
    let currentTotal = 0
    let previousTotal = 0

    for (const tx of transactions) {
        if (tx.type !== "EXPENSE") continue
        const date = new Date(tx.date)
        if (isSameMonth(date, month)) {
            current.set(tx.category, (current.get(tx.category) ?? 0) + tx.amount)
            currentTotal += tx.amount
        } else if (isSameMonth(date, previousMonth)) {
            previous.set(tx.category, (previous.get(tx.category) ?? 0) + tx.amount)
            previousTotal += tx.amount
        }
    }

    const keys = new Set<CategoryKey>([...current.keys(), ...previous.keys()])
    const categories: CategoryComparison[] = [...keys]
        .map((category) => ({
            category,
            ...makeDelta(current.get(category) ?? 0, previous.get(category) ?? 0),
        }))
        .sort((a, b) => b.current - a.current || b.previous - a.previous)

    return { total: makeDelta(currentTotal, previousTotal), categories }
}