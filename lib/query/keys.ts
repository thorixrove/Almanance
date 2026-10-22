import type { TransactionFilters } from "@/types";

export const queryKeys = {
    accounts: (userId?: string) => ["accounts", userId] as const,
    transactions: (userId?: string, filters: TransactionFilters = {}) =>
        ["transactions", userId, filters] as const,
    budgets: (userId?: string) => ["budgets", userId] as const,
    categories: (userId?: string) => ["categories", userId] as const,
    goals: (userId?: string) => ["goals", userId] as const,
    categoryBudgets: (userId?: string) => ["categoryBudgets", userId] as const,
    recurring: (userId?: string) => ["recurring", userId] as const
}