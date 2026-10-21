import { useSupabase } from "@/hooks/useSupabase";
import {
    createRecurringRule,
    deleteRecurringRule,
    NewRecurringRule,
    processMyRecurringRules,
    UpdateRecurringRule,
    updateRecurringRule,
} from "@/lib/services/recurring";
import { useUser } from "@clerk/expo";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryClient } from "@/lib/query/client";
import { string } from "zod";


async function processDue(supabase: SupabaseClient, QueryClient: QueryClient) {
    try {
        const result = await processMyRecurringRules(supabase)
        if (result.created > 0) {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                queryClient.invalidateQueries({ queryKey: ["accounts"] })
            ])
        }
    } catch (error) {

    }
}

export function useCreateRecurringRule() {
    const supabase = useSupabase()
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: NewRecurringRule) =>
            createRecurringRule(supabase, user!.id, payload),
        onSuccess: async () => {
            await processDue(supabase, queryClient)
            await queryClient.invalidateQueries({ queryKey: ["recurring"] })
        },
    })
}

export function useUpdateRecurringRule() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: UpdateRecurringRule }) =>
            updateRecurringRule(supabase, id, patch),
        onSuccess: async (_data, variables) => {
            if (variables.patch.is_active === true) {
                await processDue(supabase, queryClient)
            }
            await queryClient.invalidateQueries({ queryKey: ["recurring"] })
        },
    })
}

export function useDeleteRecurringRule() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteRecurringRule(supabase, id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["recurring"] }),
                queryClient.invalidateQueries({ queryKey: ["transactions"] })
            ])
        },
    })
}

export function useProcessRecurringRules() {
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => processMyRecurringRules(supabase),
        onSuccess: async (result) => {
            if (result.created > 0) {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
                    queryClient.invalidateQueries({ queryKey: ["accounts"] }),
                    queryClient.invalidateQueries({ queryKey: ["recurring"] }),
                ])
            }
        }
    })
}