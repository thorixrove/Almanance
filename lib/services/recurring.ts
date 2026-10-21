import type { SupabaseClient } from "@supabase/supabase-js";

import type {
    NewRecurringRule,
    ProcessRecurringResult,
    RecurringRule,
    UpdateRecurringRule,
} from "@/types/recurring";
 
export type {
    NewRecurringRule,
    ProcessRecurringResult,
    RecurringFrequency,
    RecurringRule,
    UpdateRecurringRule,
} from "@/types/recurring";


export async function getRecurringRules(supabase: SupabaseClient) {
    const {data , error} = await supabase
    .from("reccuring_rules")
    .select("*")
    .order("created_at", { ascending: true})

    if (error) throw error
    return data as RecurringRule[]
}

export async function createRecurringRule(
    supabase: SupabaseClient,
    userId: string,
    payload: NewRecurringRule
) {
    const {data, error} = await supabase
    .from("recurring_rules")
    .insert({
        user_id: userId,
        account_id: payload.account_id,
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        name: payload.name.trim(),
        frequency: payload.frequency,
        start_date: payload.start_date,
        end_date: payload.end_date ?? null,
    })
    .select()
    .single()

    if (error) throw error
    return data as RecurringRule
}

export async function updateRecurringRule(
    supabase: SupabaseClient,
    id: string,
    patch: UpdateRecurringRule
) {
    const payload: UpdateRecurringRule = { ...patch}
    if (payload.name !== undefined) payload.name = payload.name.trim()

        const {data, error} = await supabase
        .from("recurring_rules")
        .update(payload)
        .eq("id", id)
        .select()
        .single()

        if (error) throw error
        return data as RecurringRule
}

export async function deleteRecurringRule(supabase: SupabaseClient, id: string) {
    const {error} = await supabase.from("recurring_rules").delete().eq("id", id)
    if (error) throw error
}


export async function processMyRecurringRules(supabase: SupabaseClient) {
    const {data, error} = await supabase.rpc("process_my_recurring_rules")
    if (error) throw error
    return data as ProcessRecurringResult
}

function errorMessage(error: unknown) {
    return (error as {message?: string} | null)?.message ?? ""
}

export function isRecurringLimitError(error: unknown) {
    return errorMessage(error).includes("Maksimal 30 transaksi berulang")
}

export function isRecurringStartDateError(error: unknown) {
    return errorMessage(error).includes("Tanggal mulai tidak boleh sebelum hari ini")
}

export function isRecurringEndedError(error: unknown) {
    return errorMessage(error).includes("melewati tanggal akhir")
}

export function isRecurringInvalidRefError(error: unknown) {
    const message = errorMessage(error)
    return message.includes("Akun tidak valid") || message.includes("Kategori tidak valid")
}