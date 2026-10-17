import type { SupabaseClient } from "@supabase/supabase-js";

import type { Goal, NewGoal, UpdateGoal } from "@/types/goal";

export type { Goal, NewGoal, UpdateGoal } from "@/types/goal";

export async function getGoals(supabase: SupabaseClient) {
    const {data, error} = await supabase
    .from("goals")
    .select("*")
    .order("created_at", {ascending: true})

    if (error) throw error
    return data as Goal[]
}

export async function createGoal(
    supabase: SupabaseClient,
    userId: string,
    payload: NewGoal
) {
    const {data, error} = await supabase
    .from("goals")
    .insert({
        user_id: userId,
        name: payload.name.trim(),
        icon: payload.icon,
        color: payload.color,
        target_amount: payload.target_amount,
        deadline: payload.deadline,
    })
    .select()
    .single()

    if (error) throw error
    return data as Goal
}

export async function updateGoal(
    supabase: SupabaseClient,
    id: string,
    payload: UpdateGoal
) {
    const {data, error} = await supabase
    .from("goals")
    .update({
        name: payload.name.trim(),
        icon: payload.icon,
        color: payload.color,
        target_amount: payload.target_amount,
        deadline: payload.deadline,
    })
    .eq("id", id)
    .select()
    .single()

    if (error) throw error
    return data as Goal
}

export async function deleteGoal(supabase: SupabaseClient, id: string) {
    const {error} =  await supabase.from("goals").delete().eq("id", id)
    if (error) throw error
}

export async function contributeToGoal(
    supabase: SupabaseClient,
    id: string,
    amount: number
) {
    const {data, error} = await supabase.rpc("contribute_to_goal", {
        p_goal: id,
        p_amount: amount,
    })

    if (error) throw error
    return data as Goal
}

export function isGoalLimitError(error: unknown) {
    const message =  (error as {message?: string} | null)?.message ?? ""
    return message.includes("Maksimal 30 target")
}

export function isGoalInsufficientError(error: unknown) {
    const message = (error as {message?: string} | null)?.message ?? ""
    return message.includes("Dana target tidak cukup")
}