import {
  assistantConversationsKey,
} from "@/hooks/queries/useAssistantConversationsQuery";
import { assistantMessagesKey } from "@/hooks/queries/useAssistantMessagesQuery";
import { useSupabase } from "@/hooks/useSupabase";
import {
  addAssistantMessage,
  type AssistantMessage,
} from "@/lib/services/assistantMessages";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type NewMessage = {
  conversationId: string;
  role: AssistantMessage["role"];
  content: string;
};

// Pesan langsung muncul di layar (optimistic), lalu diganti data asli dari
// database setelah tersimpan. Kalau gagal tersimpan, pesan tetap terlihat
// selama sesi ini tetapi tidak masuk riwayat.
export function useAddAssistantMessage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, role, content }: NewMessage) =>
      addAssistantMessage(supabase, user!.id, conversationId, role, content),

    onMutate: async ({ conversationId, role, content }) => {
      const key = assistantMessagesKey(user?.id, conversationId);
      await queryClient.cancelQueries({ queryKey: key });

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const temp: AssistantMessage = {
        id: tempId,
        user_id: user!.id,
        conversation_id: conversationId,
        role,
        content,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<AssistantMessage[]>(key, (old = []) => [
        ...old,
        temp,
      ]);
      return { tempId };
    },

    onSuccess: (saved, { conversationId }, context) => {
      const key = assistantMessagesKey(user?.id, conversationId);
      queryClient.setQueryData<AssistantMessage[]>(key, (old = []) => {
        const hasTemp = old.some((m) => m.id === context?.tempId);
        if (hasTemp) {
          return old.map((m) => (m.id === context?.tempId ? saved : m));
        }
        // Pengaman: cache sempat tertimpa, tambahkan pesan asli bila belum ada.
        return old.some((m) => m.id === saved.id) ? old : [...old, saved];
      });

      // Urutan daftar riwayat berubah (percakapan ini jadi yang terbaru).
      queryClient.invalidateQueries({
        queryKey: assistantConversationsKey(user?.id),
      });
    },

    onError: (error) => {
      console.error("Gagal menyimpan pesan Assistant:", error);
    },
  });
}