import type { SupabaseClient } from "@supabase/supabase-js";

import type { CategoryBudget, NewCategoryBudget } from "@/types/categoryBudget";

export type { CategoryBudget, NewCategoryBudget } from "@/types/categoryBudget";

export async function getCategoryBudgets(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from("category_budgets")
        .select("*")
        .order("created_at", { ascending: true })

    if (error) throw error
    return data as CategoryBudget[]
}


export async function createCategoryBudget(
    supabase: SupabaseClient,
    userId: string,
    payload: NewCategoryBudget
) {
    const {data, error} = await supabase
    .from("category_budgets")
    .insert({
        user_id: userId,
        category: payload.category,
        amount: payload.amount,
    })
    .select()
    .single()

    if (error) throw error
    return data as CategoryBudget
}


export async function updateCategoryBudget(
    supabase: SupabaseClient,
    id: string,
    amount: number
) {
    const {data, error} = await supabase
    .from("category_budgets")
    .update({amount})
    .eq("id", id)
    .select()
    .single()

    if (error) throw error
    return data as CategoryBudget
}



export async function deleteCategoryBudget(supabase: SupabaseClient, id: string) {
    const {error} = await supabase.from("category_budgets").delete().eq("id", id)
    if (error) throw error
}

export function isCategoryBudgetLimitError(error: unknown) {
    const message = (error as {message?: string} | null)?.message ?? ""
    return message.includes("Maksimal 30 budget kategori")
}

export function isCategoryBudgetDuplicateError(error: unknown) {
    return  (error as {code?: string} | null)?.code === "23505"
}