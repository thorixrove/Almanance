import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery"
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import { askAssistant } from "@/lib/services/assistant"
import { useUserStore } from "@/store/useStore"
import { useUser } from "@clerk/expo"
import { Feather } from "@expo/vector-icons"
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useThemeColors } from "@/components/ThemeProvider"
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSupabase } from "@/hooks/useSupabase"
import { useAssistantMessagesQuery } from "@/hooks/queries/useAssistantMessagesQuery"
import { useAddAssistantMessage } from "@/hooks/mutation/useAssistantMessageMutations"
import { useCreateAssistantConversation } from "@/hooks/mutation/useAssistantConversationMutations"
import { makeConversationTitle } from "@/lib/services/assistantConversations"
import { ConversationHistory } from "@/components/ConversationHistory"

const KEYBOARD_GAP_BUFFER = 4
const TAB_BAR_CLEARANCE = 20

function useKeyboardHeight() {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow"
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide"

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0))

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  return height
}


type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_PROMPT_KEYS = [
  "assistant.suggestFood",
  "assistant.suggestBiggest",
  "assistant.suggestBudget",
] as const


// Pesan sambutan (id "welcome") hanya tampil di layar, tidak disimpan ke riwayat.

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${isUser ? "bg-solid" : "bg-card border border-line"
          }`}
      >
        <Text className={`text-sm ${isUser ? "text-on-solid" : "text-ink"}`}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}

export default function AssistantScreen() {
  const { user } = useUser()
  const { t } = useTranslation()
  const colors = useThemeColors()
  const supabase = useSupabase()
  const currency = useUserStore((s) => s.currency)
  const { refetch: refetchTransactions } = useTransactionsQuery()
  const { refetch: refetchBudget } = useBudgetQuery()
  const keyboardHeight = useKeyboardHeight()
  const insets = useSafeAreaInsets()
  const adjustedKeyboardHeight = Math.max(keyboardHeight - insets.bottom, 0)

  // null = chat baru (percakapan dibuat saat pertanyaan pertama dikirim)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [historyVisible, setHistoryVisible] = useState(false)

  const { data: stored = [], isLoading: loadingMessages } =
    useAssistantMessagesQuery(activeId)
  const addMessage = useAddAssistantMessage()
  const createConversation = useCreateAssistantConversation()
  const listRef = useRef<FlatList<ChatMessage>>(null)

  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const messages: ChatMessage[] = loadingMessages
    ? []
    : stored.length === 0
      ? [{ id: "welcome", role: "assistant", content: t("assistant.welcome") }]
      : stored


  const sendMessage = async (text: string) => {
    const question = text.trim()
    if (!question || sending || !user) return

    // Riwayat dikirim TANPA pertanyaan ini, dan hanya dari percakapan yang aktif.
    const history = stored.map((m) => ({ role: m.role, content: m.content }))

    setErrorMessage(null)
    setInput("")
    setSending(true)

    // Chat baru: buat percakapan dulu, judulnya dari pertanyaan pertama.
    let conversationId = activeId
    if (!conversationId) {
      try {
        const conversation = await createConversation.mutateAsync(
          makeConversationTitle(question)
        )
        conversationId = conversation.id
        setActiveId(conversation.id)
      } catch (error) {
        console.error("Create conversation error:", error)
        setErrorMessage(t("assistant.startFailed"))
        setInput(question)
        setSending(false)
        return
      }
    }

    addMessage.mutate({ conversationId, role: "user", content: question })

    try {
      const [{ data: transactions = [] }, { data: budgets = null }] =
        await Promise.all([refetchTransactions(), refetchBudget()])
      const reply = await askAssistant(
        supabase,
        question,
        transactions,
        budgets,
        currency,
        history
      )
      addMessage.mutate({ conversationId, role: "assistant", content: reply })
    } catch (error) {
      console.error("Assistant Error:", error)
      // Pesan error hanya tampil sementara, tidak disimpan ke riwayat.
      setErrorMessage(t("assistant.answerFailed"))
    } finally {
      setSending(false)
    }
  }

  const handleNewChat = () => {
    setActiveId(null)
    setErrorMessage(null)
    setInput("")
  }

  const handleSelectConversation = (conversationId: string) => {
    setActiveId(conversationId)
    setErrorMessage(null)
    setHistoryVisible(false)
  }

  const handleConversationDeleted = (conversationId: string) => {
    if (conversationId === activeId) handleNewChat()
  }


  const inputBottomPadding = keyboardHeight > 0 ? adjustedKeyboardHeight + KEYBOARD_GAP_BUFFER : TAB_BAR_CLEARANCE

  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top"]}>
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <Text className="text-ink text-xl font-semibold">{t("tabs.assistant")}</Text>
        <View className="flex-row items-center gap-5">
          <TouchableOpacity
            onPress={handleNewChat}
            disabled={sending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ opacity: sending ? 0.3 : 1 }}
          >
            <Feather name="edit" size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setHistoryVisible(true)}
            disabled={sending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ opacity: sending ? 0.3 : 1 }}
          >
            <Feather name="clock" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? -70 : 0}
        className="flex-1"
      >
        <FlatList
          ref={listRef}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          ListFooterComponent={
            sending || loadingMessages ? (
              <View className="self-start mb-3 bg-white border border-[#E8E6DF] rounded-2xl px-3.5 py-2.5">
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : errorMessage ? (
              <View className="self-start mb-3 max-w-[85%] bg-white border border-[#E8E6DF] rounded-2xl px-3.5 py-2.5">
                <Text className="text-sm text-brand-bg">{errorMessage}</Text>
              </View>
            ) : null
          }
        />

        {!loadingMessages && !sending && stored.length === 0 && (
          <View className="px-5 pb-2 gap-2">
            {SUGGESTED_PROMPT_KEYS.map((promptKey) => (
              <TouchableOpacity
                key={promptKey}
                onPress={() => sendMessage(t(promptKey))}
                className="bg-card rounded-xl border border-line px-3.5 py-2.5 self-start"
              >
                <Text className="text-brand-text-secondary text-xs">
                  {t(promptKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* fixxing padding to clear the native tab bar - simplest fix, adjust the 90 if it still overlaps on your device */}
        <View
          className="flex-row items-center gap-2 px-5 pt-2"
          style={{ paddingBottom: inputBottomPadding }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("assistant.placeholder")}
            placeholderTextColor="#8A8D96"
            editable={!sending}
            className="flex-1 bg-card border border-line rounded-full px-4 py-3 text-sm text-ink"
            onSubmitEditing={() => sendMessage(input)}
            returnKeyLabel="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={sending}
            className="w-11 h-11 rounded-full bg-solid items-center justify-center"
            style={{ opacity: sending ? 0.6 : 1 }}
          >
            <Feather name="arrow-up" size={18} color={colors.onSolid} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConversationHistory
        visible={historyVisible}
        activeId={activeId}
        onClose={() => setHistoryVisible(false)}
        onSelect={handleSelectConversation}
        onDeleted={handleConversationDeleted}
      />
    </SafeAreaView>
  )
}