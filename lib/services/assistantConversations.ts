import type { SupabaseClient } from "@supabase/supabase-js";

export type AssistantConversation = {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

const DEFAULT_TITLE = "New chat";
const MAX_TITLE_LENGTH = 40;

export function makeConversationTitle(question: string) {
    const clean = question.replace(/\s+/g, " ").trim()
    if (!clean) return DEFAULT_TITLE
    return clean.length > MAX_TITLE_LENGTH
        ? `${clean.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
        : clean;
}

export async function getAssistantConversations(
    supabase: SupabaseClient,
    userId: string
) {
    const {data, error} = await supabase
    .from("assistant_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false})

    if (error) throw error
    return data as AssistantConversation[]
}

export async function createAssistantConversation(
    supabase: SupabaseClient,
    userId: string,
    title: string = DEFAULT_TITLE
) {
    const { data, error} = await supabase
    .from("assistant_conversations")
    .insert({ user_id: userId, title})
    .select()
    .single()

    if (error) throw error
    return data as AssistantConversation
}

export async function deleteAssistantConversation(
    supabase: SupabaseClient,
    conversationId: string
) {
    const {error} = await supabase
    .from("assistant_conversations")
    .delete()
    .eq("id", conversationId)

    if (error) throw error
}