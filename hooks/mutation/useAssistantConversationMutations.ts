import { assistantConversationsKey } from "@/hooks/queries/useAssistantConversationsQuery";
import { assistantMessagesKey } from "@/hooks/queries/useAssistantMessagesQuery";
import { useSupabase } from "@/hooks/useSupabase";
import {
  createAssistantConversation,
  deleteAssistantConversation,
  type AssistantConversation,
} from "@/lib/services/assistantConversations";
import type { AssistantMessage } from "@/lib/services/assistantMessages";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAssistantConversation() {
    const supabase = useSupabase()
    const {user} = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (title: string) =>
            createAssistantConversation(supabase, user!.id, title),

        onSuccess: (conversation) => {
            queryClient.setQueryData<AssistantConversation[]>(
                assistantConversationsKey(user?.id),
                (old = []) => [conversation, ...old]
            )
            queryClient.setQueryData<AssistantMessage[]>(
                assistantMessagesKey(user?.id, conversation.id),
                []
            )
        },
    })
}

export function useDeleteAssistantConversation() {
    const supabase = useSupabase()
    const {user} = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (conversationId: string) =>
            deleteAssistantConversation(supabase, conversationId),

        onSuccess: (_data, conversationId) => {
            queryClient.setQueryData<AssistantConversation[]>(
                assistantConversationsKey(user?.id),
                (old = []) => old.filter((c) => c.id !== conversationId)
            )
            queryClient.removeQueries({
                queryKey: assistantMessagesKey(user?.id, conversationId)
            })
        }
    })
}