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
  TransactionType,
} from "@/types/transaction"



export async function getTransactions(
    supabase: SupabaseClient,
    userId: string,
    filters: TransactionFilters = {}
) {
    let query = supabase.from("transactions").select("*").eq("user_id", userId)

    if (filters.type) query = query.eq("type", filters.type)
    if (filters.accountId) query = query.eq("account_id", filters.accountId)

    const { data, error} = await query.order("date", {ascending: false})

    if (error) throw error
    return data as Transaction[]
}


export async function createTransaction(
    supabase: SupabaseClient,
    payload: NewTransaction
) {
    const {data, error} = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single()

    if ( error) return {transaction: null, error}
    return {transaction: data as Transaction, error: null}
}



export async function deleteTransaction (
    supabase: SupabaseClient,
    transactionId: string,
    _accountId?: string,
    _amount?: number,
    _type?: TransactionType
 ) {
    const { error} = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)

    return {error}
}

export async function deleteTransactions(
    supabase: SupabaseClient,
    transactions: Pick<Transaction, "id" | "account_id" | "amount" | "type">[]
) {
    if (transactions.length === 0) return { error: null }

    const ids = transactions.map((tx) => tx.id)

    const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", ids)

    return { error }
}