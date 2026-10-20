import type { CategoryBudget } from "@/types/categoryBudget";
import type { Transaction } from "@/types/transaction";
import { isSameMonth } from "date-fns";

// Sama dengan ambang email di check-budget-alerts.
export const BUDGET_WARNING_PERCENT = 80;
export const BUDGET_OVER_PERCENT = 100;

export type CategoryBudgetStatus = "safe" | "warning" | "over";

export type CategoryBudgetUsage = {
    budget: CategoryBudget
    spent: number
    percent: number
    barPercent: number
    remaining: number
    status: CategoryBudgetStatus
}

export function sumExpenseByCategory(
    transactions: Transaction[],
    month: Date = new Date()
) {
    const totals = new Map<string, number>()
    for (const tx of transactions) {
        if (tx.type !== "EXPENSE") continue
        if (!isSameMonth(new Date(tx.date), month)) continue
        totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount)
    }
    return totals
}

export function getCategoryBudgetUsage(
    budget: CategoryBudget,
    spent: number
): CategoryBudgetUsage {
    const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    const status: CategoryBudgetStatus =
    percent >= BUDGET_OVER_PERCENT ? "over"  : percent >= BUDGET_OVER_PERCENT ? "warning" : "safe"

    return {
        budget,
        spent,
        percent,
        barPercent: Math.min(100, Math.max(0, percent)),
        remaining: budget.amount - spent,
        status,
    }
}

export function buildCategoryBudgetUsages(
    budgets: CategoryBudget[],
    transactions: Transaction[],
    month: Date = new Date()
): CategoryBudgetUsage[] {
    const totals = sumExpenseByCategory(transactions, month)
    return budgets
    .map((budget) => getCategoryBudgetUsage(budget, totals.get(budget.category) ?? 0))
    .sort((a, b) => b.percent - a.percent)
}

export function summarizeCategoryBudgets(usages: CategoryBudgetUsage[]) {
    let warning = 0
    let over = 0
    for (const usage of usages) {
        if (usage.status === "over") over++
        else if (usage.status === "warning") warning++
    }
    return {total: usages.length, warning, over}
}