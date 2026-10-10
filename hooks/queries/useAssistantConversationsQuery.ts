import { useSupabase } from "@/hooks/useSupabase";
import { getAssistantConversations } from "@/lib/services/assistantConversations";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export const assistantConversationsKey = (userId?: string) =>
["assistantConversations", userId] as const

export function useAssistantConversationsQuery() {
    const {user} = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: assistantConversationsKey(user?.id),
        queryFn: () => getAssistantConversations(supabase, user!.id),
        enabled: !!user,
    })
}