import { SupabaseClient } from "@supabase/supabase-js";

export type NewTransfer = {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    note?: string | null;
}

export async function createTransfer(
    supabase: SupabaseClient,
    payload: NewTransfer
) {
    const { data, error } = await supabase.rpc("create_transfer", {
        p_from_account: payload.fromAccountId,
        p_to_account: payload.toAccountId,
        p_amount: payload.amount,
        p_date: payload.date,
        p_note: payload.note ?? null,
    })

    if (error) return {transferId: null, error}
    return {transferId: data as string, error: null}
}

export async function deleteTransfer(
    supabase: SupabaseClient,
    transferId: string
) {
    const {error} = await supabase
    .from("transactions")
    .delete()
    .eq("transfer_id", transferId)

    return { error}
}