import type { SupabaseClient } from "@supabase/supabase-js";

export type AssistantMessage = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// Jumlah pesan terbaru yang dimuat saat sebuah percakapan dibuka.
const DEFAULT_LIMIT = 50;

// Mengembalikan pesan satu percakapan, urut lama -> baru.
export async function getAssistantMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit = DEFAULT_LIMIT
) {
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as AssistantMessage[]).reverse();
}

export async function addAssistantMessage(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  role: AssistantMessage["role"],
  content: string
) {
  const { data, error } = await supabase
    .from("assistant_messages")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AssistantMessage;
}