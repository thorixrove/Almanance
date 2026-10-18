import { useSupabase } from "../useSupabase";
import {
    contributeToGoal,
    createGoal,
    deleteGoal,
    NewGoal,
    updateGoal,
    UpdateGoal,
} from "@/lib/services/goals";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateGoal() {
    const supabase = useSupabase()
    const {user} = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewGoal) => createGoal(supabase, user!.id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["goals"]})
        },
    })
}

export function useUpdateGoal() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload}: {id: string; payload: UpdateGoal}) =>
            updateGoal(supabase, id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["goals"]})
        },
    })
}

export function useDeleteGoal() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteGoal(supabase, id),
        onSuccess: async  () => {
            await queryClient.invalidateQueries({ queryKey: ["goals"]})
        },
    })
}

export function useContributeToGoal() {
    const supabase  = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, amount}: {id: string; amount: number}) =>
            contributeToGoal(supabase, id, amount),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["goals"]})
        }
    })
}