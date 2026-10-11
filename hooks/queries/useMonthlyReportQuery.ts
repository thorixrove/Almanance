import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import {
    buildMonthlyReport,
    getReportQueryRange,
} from "@/lib/utils/monthlyReport"
import { useMemo } from "react"

export function useMonthlyReportQuery(month: Date) {
    const monthTime = startOfMonthTime(month)
    const range = useMemo(
        () => getReportQueryRange(new Date(monthTime)),
        [monthTime]
    )
    const query = useTransactionsQuery({ type: "EXPENSE", ...range })

    const report = useMemo(
        () => buildMonthlyReport(query.data ?? [], new Date(monthTime)),
        [query.data, monthTime]
    )

    return { ...query, report }
}

function startOfMonthTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
}