import type { TFunction } from "i18next";

import { formatDate } from "@/lib/i18n/dateLocale";
import { parseDeadline } from "@/lib/utils/goals";
import type { RecurringFrequency, RecurringRule } from "@/types/recurring";

const MONTHLY_FACTOR: Record<RecurringFrequency, number> = {
    DAILY: 365 / 12,
    WEEKLY: 52 / 12,
    MONTHLY: 1,
    YEARLY: 1 / 12,
}

export type RecurringStatus = "active" | "paused" | "ended"

export type RecurringSummary = {
    activeCount: number
    pausedCount: number
    monthlyExpense: number
    monthlyIncome: number
}

export function toMonthlyAmount(rule: RecurringRule) {
    return Number(rule.amount) * MONTHLY_FACTOR[rule.frequency]
}

export function getRecurringStatus(rule: RecurringRule): RecurringStatus {
    if (rule.end_date && rule.next_run_date > rule.end_date) return "ended"
    return rule.is_active ? "active" : "paused"
}

export function summarizeRecurring(rules: RecurringRule[]): RecurringSummary {
    let activeCount = 0
    let pausedCount = 0
    let monthlyExpense = 0
    let monthlyIncome = 0

    for (const rule of rules) {
        const status = getRecurringStatus(rule)
        if (status === "paused") pausedCount += 1
        if (status !== "active") continue

        activeCount += 1
        if (rule.type === "EXPENSE") monthlyExpense += toMonthlyAmount(rule)
        else if (rule.type === "INCOME") monthlyIncome += toMonthlyAmount(rule)
    }
    return { activeCount, pausedCount, monthlyExpense, monthlyIncome }
}

export function sortRecurringRules(rules: RecurringRule[]) {
    const order: Record<RecurringStatus, number> = { active: 0, paused: 1, ended: 2 }
    return [...rules].sort((a, b) => {
        const byStatus = order[getRecurringStatus(a)] - order[getRecurringStatus(b)]
        if (byStatus !== 0) return byStatus
        return a.next_run_date.localeCompare(b.next_run_date)
    })
}

export function hasMonthEndClamp(frequency: RecurringFrequency, startDate: string) {
    const start = parseDeadline(startDate)
    if (frequency === "MONTHLY") return start.getDate() > 28
    if (frequency === "YEARLY") return start.getMonth() === 1 && start.getDate() === 29
    return false
}

export function getScheduleLabel(
    rule: Pick<RecurringRule, "frequency" | "start_date">,
    t: TFunction
) {
    const start = parseDeadline(rule.start_date)
    switch (rule.frequency) {
        case "DAILY":
            return t("recurring.schedule.everyDay")
        case "WEEKLY":
            return t("recurring.schedule.everyWeek", { day: formatDate(start, "EEEE") })
        case "MONTHLY":
            return t("recurring.schedule.everyMonth", { day: start.getDate() })
        case "YEARLY":
            return t("recurring.schedule.everyYear", { date: formatDate(start, "d MMM") })
    }
}

export function getNextRunLabel(rule: Pick<RecurringRule, "next_run_date">, t: TFunction) {
    return t("recurring.schedule.next", {
        date: formatDate(parseDeadline(rule.next_run_date), "d MMMM yyyy"),
    })
}