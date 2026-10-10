import { useSupabase } from "@/hooks/useSupabase";
import { getAssistantMessages } from "@/lib/services/assistantMessages";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export const assistantMessagesKey = (userId?: string, conversation_id?: string | null) =>
["assistantMessages", userId, conversation_id] as const

export function useAssistantMessagesQuery(conversationId: string | null) {
    const {user} = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: assistantMessagesKey(user?.id, conversationId),
        queryFn: () => getAssistantMessages(supabase, conversationId!),
        enabled: !!user && !!conversationId,
        staleTime: Infinity,
    })
}