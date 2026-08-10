import type { TransactionFilters } from "@/types";

export const queryKeys = {
    accounts: (userId?: string) => ["accounts", userId] as const,
    transactions: (userId?: string, filters: TransactionFilters = {}) => 
    ["transactions", userId, filters] as const,
    budgets: (userId?: string) => ["budgets", userId] as const,
}