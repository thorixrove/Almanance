import { SupabaseClient } from "@supabase/supabase-js";

import type {
    NewTransaction,
    Transaction,
    TransactionFilters,
    TransactionType,
} from "@/types/transaction";

export type {
    InputMethod,
    NewTransaction,
    Transaction,
    TransactionFilters,
    TransactionType
} from "@/types/transaction";



export async function getTransactions(
    supabase: SupabaseClient,
    userId: string,
    filters: TransactionFilters = {}
) {
    let query = supabase.from("transactions").select("*").eq("user_id", userId)

    if (filters.type) query = query.eq("type", filters.type)
    if (filters.accountId) query = query.eq("account_id", filters.accountId)
    if (filters.dateFrom) query = query.gte("date", filters.dateFrom)
    if (filters.dateTo) query = query.lte("date", filters.dateTo)

        const { data, error } = await query.order("date", { ascending: false })

    if (error) throw error
    return data as Transaction[]
}


export async function createTransaction(
    supabase: SupabaseClient,
    payload: NewTransaction
) {
    const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select()
        .single()

    if (error) return { transaction: null, error }
    return { transaction: data as Transaction, error: null }
}

export type UpdateTransactionPayload = Partial<
    Pick<
        NewTransaction,
        "account_id" | "type" | "amount" | "category" | "description" | "date"
    >
>

export async function updateTransaction(
    supabase: SupabaseClient,
    transactionId: string,
    payload: UpdateTransactionPayload
) {
    const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transactionId)
        .select()
        .single()

    if (error) return { transaction: null, error }
    return { transaction: data as Transaction, error: null }
}



export async function deleteTransaction(
    supabase: SupabaseClient,
    transactionId: string,
    _accountId?: string,
    _amount?: number,
    _type?: TransactionType,
    transferId?: string | null
) {
    const query = supabase.from("transactions").delete()

    // Baris transfer selalu dihapus berpasangan (trigger mengembalikan kedua saldo).
    const { error } = transferId
        ? await query.eq("transfer_id", transferId)
        : await query.eq("id", transactionId)

    return { error }
}

type DeleteTransactionItem = Pick<
    Transaction,
    "id" | "account_id" | "amount" | "type"
> & {
    transfer_id?: string | null
}

export async function deleteTransactions(
    supabase: SupabaseClient,
    transactions: DeleteTransactionItem[]
) {
    if (transactions.length === 0) return { error: null }

    const ids = transactions.map((tx) => tx.id)
    const transferIds = [
        ...new Set(
            transactions
                .map((tx) => tx.transfer_id)
                .filter((id): id is string => !!id)
        ),
    ]

    const query = supabase.from("transactions").delete()

    // Kalau ada baris transfer di pilihan, pasangannya ikut dihapus.
    const { error } =
        transferIds.length > 0
            ? await query.or(
                  `id.in.(${ids.join(",")}),transfer_id.in.(${transferIds.join(",")})`
              )
            : await query.in("id", ids)

    return { error }
}