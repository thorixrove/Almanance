import { differenceInCalendarDays } from "date-fns"

import type { Goal } from "@/types/goal"

export type GoalProgress = {
    percent: number
    remaining: number
    isComplete: boolean
    daysLeft: number | null
    monthlyNeeded: number | null
}

export function parseDeadline(deadline: string): Date {
    const [y, m, d] = deadline.split("-").map(Number)
    return new Date(y, m - 1, d)
}

export function toDeadlineString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export function getGoalProgress(goal: Goal, now: Date = new Date()): GoalProgress {
    const target = Number(goal.target_amount)
    const saved = Number(goal.saved_amount)
    const remaining = Math.max(0, target - saved)
    const isComplete = saved >= target
    const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0

    const daysLeft = goal.deadline
    ? differenceInCalendarDays(parseDeadline(goal.deadline), now)
    : null

    let monthlyNeeded: number | null = null
    if(!isComplete && daysLeft !== null && daysLeft > 0) {
        const month = Math.max(11, Math.ceil(daysLeft / 30))
        monthlyNeeded = remaining / month
    }

    return { percent, remaining, isComplete, daysLeft, monthlyNeeded }
}