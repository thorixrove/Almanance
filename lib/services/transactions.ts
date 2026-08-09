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
    const { data: transactions, error: insertError } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

    if (insertError) return { transactions, error: insertError}

    const { data: accounts, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", payload.account_id)
    .single();

     if (fetchError) return { transactions, error: fetchError };

    const delta = payload.type === "INCOME" ? payload.amount : -payload.amount;

  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ balance: accounts.balance + delta })
    .eq("id", payload.account_id);

  if (balanceError) return { transactions, error: balanceError };

  return { transaction: transactions as Transaction, error: null };
}



export async function deleteTransaction (
    supabase: SupabaseClient,
    transactionId: string,
    accountId: string,
    amount: number,
    type: TransactionType
 ) {
    const { error: deleteError} = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)

    if (deleteError) return {error: deleteError}

    const { data: accounts, error: fetchError} = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single()

    if (fetchError) return { error: fetchError}

    const delta = type === "INCOME" ? -amount : amount

    const { error: balanceError} = await supabase
    .from("accounts")
    .update({balance: accounts.balance + delta})
    .eq("id", accountId)

    if (balanceError) return { error: balanceError}
    
    return { error: null}
}