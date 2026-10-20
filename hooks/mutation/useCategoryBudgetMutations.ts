import { useSupabase } from "@/hooks/useSupabase";
import {
    createCategoryBudget,
    deleteCategoryBudget,
    NewCategoryBudget,
    updateCategoryBudget,
} from "@/lib/services/categoryBudgets";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function useCreateCategoryBudget() {
    const supabase = useSupabase()
    const {user} = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewCategoryBudget) =>
            createCategoryBudget(supabase, user!.id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["categoryBudgets"]})
        },
    })
}

export function useUpdateCategoryBudget() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, amount}: {id: string; amount: number}) =>
            updateCategoryBudget(supabase, id, amount),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["categoryBudgets"]})
        },
    })
}


export function useDeleteCategoryBudget() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteCategoryBudget(supabase, id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["categoryBudgets"]})
        }
    })
}