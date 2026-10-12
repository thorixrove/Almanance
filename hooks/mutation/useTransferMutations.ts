import { useSupabase } from "../useSupabase";
import {
    createTransfer,
    deleteTransfer,
    NewTransfer,
} from "@/lib/services/transfers";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateTransfer() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewTransfer) => createTransfer(supabase, payload),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transaction"]})
            queryClient.invalidateQueries({ queryKey: ["accounts"]})
        },
    })
}

export function useDeleteTransfer() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (transferId: string) => deleteTransfer(supabase, transferId),
        onSuccess: (result) => {
            if (result.error) return
            queryClient.invalidateQueries({ queryKey: ["transactions"]})
            queryClient.invalidateQueries({ queryKey: ["accounts"]})
        }
    })
}
