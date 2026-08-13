import { useSupabase } from "../useSupabase";
import {
  createTransaction,
  deleteTransaction,
  deleteTransactions,
  NewTransaction,
  Transaction,
  TransactionType,
} from "@/lib/services/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateTransactions() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewTransaction) => createTransaction(supabase, payload),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"]})
            queryClient.invalidateQueries({ queryKey: ["accounts"]})
        },
    })
}


    export function useDeleteTransactions() {
        const supabase = useSupabase()
        const queryClient = useQueryClient()

        return useMutation({
            mutationFn: (tx: Pick<Transaction, "id" | "account_id" | "amount" | "type">) =>
                deleteTransaction(supabase, 
                    tx.id, 
                    tx.account_id, 
                    tx.amount, 
                    tx.type as TransactionType
                ),
            onSuccess: (result) => {
                if (result.error) return
                queryClient.invalidateQueries({ queryKey: ["transactions"]})
                queryClient.invalidateQueries({ queryKey: ["accounts"]})
            },
        })
    }

    export function useDeleteTransactionsBulk() {
        const supabase = useSupabase()
        const queryClient = useQueryClient()

        return useMutation({
            mutationFn: (
                txs: Pick<Transaction, "id" | "account_id" | "amount" | "type">[]
            ) => deleteTransactions(supabase, txs),
            onSuccess: (result) => {
                if (result.error) return
                queryClient.invalidateQueries({ queryKey: ["transactions"]})
                queryClient.invalidateQueries({ queryKey: ["accounts"]})
            },
        })
    }