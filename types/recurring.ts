import type { TransactionType } from "./transaction";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurringRule = {
    id: string;
    user_id: string;
    account_id: string;
    type: TransactionType;
    amount: number;
    // key kategori: bawaan ("food") atau custom ("c_xxxxxxxxxxxx")
    category: string;
    name: string;
    frequency: RecurringFrequency;
    // "YYYY-MM-DD"
    start_date: string;
    end_date: string | null;
    next_index: number;
    // kemunculan berikutnya, dihitung server (trigger guard)
    next_run_date: string;
    is_active: boolean;
    last_run_at: string | null;
    created_at: string;
    updated_at: string;
};

export type NewRecurringRule = {
    account_id: string;
    type: TransactionType;
    amount: number;
    category: string;
    name: string;
    frequency: RecurringFrequency;
    start_date: string;
    end_date?: string | null;
};

// type, frequency, dan start_date tidak bisa diubah setelah dibuat
export type UpdateRecurringRule = Partial<
    Pick<
        RecurringRule,
        "account_id" | "amount" | "category" | "name" | "end_date" | "is_active"
    >
>;

export type ProcessRecurringResult = {
    created: number;
    failed: number;
};