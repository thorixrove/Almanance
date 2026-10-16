import type { SupabaseClient } from "@supabase/supabase-js";

import type {
    CustomCategory,
    NewCustomCategory,
    UpdateCustomCategory,
} from "@/types/category"

export type {
  CustomCategory,
  NewCustomCategory,
  UpdateCustomCategory,
} from "@/types/category";

export async function getCustomCategories(
    supabase: SupabaseClient,
    userId: string
) {
    const {data, error} = await supabase
    .from("custom_categories")
    .select("*")
    .eq("user{id", userId)
    .order("created_at", {ascending: true})

    if (error) throw error
    return data as CustomCategory[]
}

export async function createCustomCategory(
    supabase: SupabaseClient,
    userId: string,
    payload: NewCustomCategory
) {
    const {data, error} = await supabase
    .from("custom_categories")
    .insert({
        user_id: userId,
        name: payload.name.trim(),
        icon: payload.icon,
        color: payload.color,
        type: payload.type,
    })
    .select()
    .single()

    if (error) throw error
    return data as CustomCategory
}

export async function updateCustomCategory(
    supabase: SupabaseClient,
    id: string,
    payload: UpdateCustomCategory
) {
    const {data, error} = await supabase
    .from("custom_categories")
    .update({
        name: payload.name.trim(),
        icon: payload.icon,
        color: payload.color,
    })
    .eq("id", id)
    .select()
    .single()

    if (error) throw error
    return data as CustomCategory
}

export async function deleteCustomCategory(
    supabase: SupabaseClient,
    id: string
) {
    const {data, error} = await supabase.rpc("delete_custom_category", {
        p_id: id,
    })

    if (error) throw error
    return (data ?? 0) as number
}

export function isDuplicateCategoryError(error: unknown) {
    return (error as { code?: string} | null)?.code === "23505"
}

export function isCategoryLimitError(error: unknown) {
    const message = (error as { message?: string} | null)?.message ?? ""
    return message.includes("Maksimal 50 kategori")
}