import type { CategoryKey } from "@/constants/categories";

export type ReportDelta = {
    current: number
    previous: number
    diff: number
    percent: number | null
}

export type CategoryComparison = ReportDelta & {
    category: CategoryKey
}

export type MonthlyReport = {
    total: ReportDelta
    categories: CategoryComparison[]
}