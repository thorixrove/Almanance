import { BottomSheet } from "@/components/BottomSheet"
import { useAssistantConversationsQuery } from "@/hooks/queries/useAssistantConversationsQuery"
import { useDeleteAssistantConversation } from "@/hooks/mutation/useAssistantConversationMutations"
import type { AssistantConversation } from "@/lib/services/assistantConversations"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

type Props = {
  visible: boolean
  activeId: string | null
  onClose: () => void
  onSelect: (conversationId: string) => void
  // Dipanggil setelah percakapan terhapus, supaya layar bisa reset kalau yang aktif dihapus
  onDeleted: (conversationId: string) => void
}

export function ConversationHistory({
  visible,
  activeId,
  onClose,
  onSelect,
  onDeleted,
}: Props) {
  const { data: conversations = [], isLoading, isError, refetch } =
    useAssistantConversationsQuery()
  const deleteConversation = useDeleteAssistantConversation()

  const confirmDelete = (conversation: AssistantConversation) => {
    Alert.alert(
      "Delete chat?",
      `"${conversation.title}" will be deleted permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteConversation.mutate(conversation.id, {
              onSuccess: () => onDeleted(conversation.id),
              onError: () =>
                Alert.alert("Failed", "Could not delete the chat. Try again."),
            }),
        },
      ]
    )
  }

  return (
    // Sheet yang sama dengan Edit transaction: geser ke bawah atau ketuk area gelap untuk menutup
    <BottomSheet visible={visible} title="Chat history" onClose={onClose}>
      {isLoading ? (
        <View className="py-10 items-center">
          <ActivityIndicator size="small" color="#4A9EFF" />
        </View>
      ) : isError ? (
        <View className="py-10 items-center">
          <Text className="text-brand-text-secondary text-sm mb-3">
            Could not load your chats.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-brand-bg rounded-full px-5 py-2"
          >
            <Text className="text-white text-sm">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View className="py-10 items-center">
          <Text className="text-brand-text-secondary text-sm">
            No chats yet. Ask something to start one.
          </Text>
        </View>
      ) : (
        conversations.map((item) => {
          const isActive = item.id === activeId
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              className={`flex-row items-center rounded-2xl px-3.5 py-3 mb-2 border ${
                isActive
                  ? "bg-white border-[#4A9EFF]"
                  : "bg-white border-[#E8E6DF]"
              }`}
            >
              <Feather name="message-circle" size={18} color="#8A8D96" />
              <View className="flex-1 mx-3">
                <Text
                  className="text-brand-bg text-sm font-medium"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-brand-text-secondary text-xs mt-0.5">
                  {format(new Date(item.updated_at), "d MMM yyyy, HH:mm")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                disabled={deleteConversation.isPending}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="trash-2" size={18} color="#8A8D96" />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })
      )}
    </BottomSheet>
  )
}