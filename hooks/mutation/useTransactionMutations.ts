import {
    createTransaction,
    deleteTransaction,
    deleteTransactions,
    NewTransaction,
    Transaction,
    TransactionType,
    updateTransaction,
    UpdateTransactionPayload,
} from "@/lib/services/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

type TransactionDeleteInput = Pick<
    Transaction,
    "id" | "account_id" | "amount" | "type"
> & {
    transfer_id?: string | null;
};

export function useCreateTransactions() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewTransaction) => createTransaction(supabase, payload),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
        },
    })
}

export function useUpdateTransaction() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: UpdateTransactionPayload
        }) => updateTransaction(supabase, id, payload),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
        },
    })
}

export function useDeleteTransactions() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (tx: TransactionDeleteInput) => {
            const transferId = typeof tx.transfer_id === "string" ? tx.transfer_id : null

            return deleteTransaction(
                supabase,
                tx.id,
                tx.account_id,
                tx.amount,
                tx.type as TransactionType,
                transferId
            )
        },
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
        },
    })
}

export function useDeleteTransactionsBulk() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (txs: TransactionDeleteInput[]) => deleteTransactions(supabase, txs),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
        },
    })
}