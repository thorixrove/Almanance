import { useSupabase } from "../useSupabase";
import {
    createCustomCategory,
    deleteCustomCategory,
    NewCustomCategory,
    updateCustomCategory,
    UpdateCustomCategory,
} from "@/lib/services/categories";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCategory() {
    const supabase = useSupabase()
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewCustomCategory) =>
            createCustomCategory(supabase, user!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })
}

export function useUpdateCategory() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: UpdateCustomCategory
        }) => updateCustomCategory(supabase, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        }
    })
}

export function useDeleteCategory() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteCustomCategory(supabase, id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["categories"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] })
            ])
        },
    })
}