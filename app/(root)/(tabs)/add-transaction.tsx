import { AIActionCard } from "@/components/AIActionCard";
import { CalendarPicker } from "@/components/CalendarPicker";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import { PillGroup } from "@/components/PillGroup";
import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CategoryKey, getCategoryLabel } from "@/constants/categories";
import { formatDate } from "@/lib/i18n/dateLocale";
import { useTranslation } from "react-i18next";
import { useCreateTransactions } from "@/hooks/mutation/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useSupabase } from "@/hooks/useSupabase";
import {
  TransactionFormValues,
  transactionSchema,
} from "@/lib/schemas/transaction";
import { Account } from "@/lib/services/accounts";
import {
  ExtractedTransaction,
  extractTransactionFromReceipt,
} from "@/lib/services/extractTransaction";
import { InputMethod } from "@/lib/services/transactions";
import { parseAmount } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValid } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, labelKey: "transactions.expense" },
  { key: "INCOME" as const, labelKey: "transactions.income" },
]

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

const DEFAULT_VALUES = (accounts: Account[]): TransactionFormValues => ({
  type: "EXPENSE",
  amount: "",
  category: "food",
  acccountId: accounts[0]?.id ?? "",
  description: "",
  date: new Date(),
})



export default function AddTransaction() {
  const {user} = useUser()
  const { t } = useTranslation()
  const router = useRouter()
  const params = useLocalSearchParams<{action?: string}>()
  const keyboardHeight = useKeyboardHeight()

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = useAccountsQuery()
  const { mutateAsync: createTransaction, isPending: saving} =
  useCreateTransactions()

  const supabase = useSupabase();
  const [error, setError] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: {errors},
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES([]),
  })

  const type = watch("type")
  const category = watch("category")
  const accountId = watch("acccountId")
  const date = watch("date")

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    if (accounts.length > 0) resetForm(DEFAULT_VALUES(accounts))
  }, [accounts, resetForm])

  const applyExtraction = (result: ExtractedTransaction) => {
    const categoryList =
    result.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categoryList.some((c) => c.key === key)

    if (result.type) setValue("type", result.type)
      if (isValidCategory(result.category)) setValue("category", result.category)
        if (result.amount != null) setValue("amount", String(result.amount))
          if (result.description) setValue("description", result.description)
            if (result.date) {
              const parseDate = new Date(result.date)
              if (isValid(parseDate) && parseDate <= new Date()) {
                setValue("date", parseDate)
              }
            }

            const missing = [
              result.amount == null && t("addTransaction.fieldAmount"),
              !isValidCategory(result.category) && t("addTransaction.fieldCategory"),
            ].filter(Boolean)
            if (missing.length > 0) {
              Alert.alert(
                t("addTransaction.reviewTitle"),
                t("addTransaction.reviewMessage", {
                  fields: missing.join(t("addTransaction.fieldJoiner")),
                })
              )
            }
  }

  const handleReceiptCaptured = async (base64: string, mimeType: string) => {
    setScannerOpen(false)
    setScanning(true)
    try {
      const extracted = await extractTransactionFromReceipt(supabase, base64, mimeType)
      applyExtraction(extracted)
      setInputMethod("RECEIPT_SCAN")
    } catch (error) {
      console.error("Receipt scan folder:", error)
      Alert.alert(t("common.error"), t("addTransaction.receiptFailed"))
    } finally {
      setScanning(false)
    }
  }

  const handleVoiceExtracted = (result: ExtractedTransaction) => {
    applyExtraction(result)
    setVoiceTranscript(result.transcript)
    setInputMethod("VOICE")
  }

  useEffect(() => {
    if (params.action === "scan") {
      setScannerOpen(true)
      router.setParams({ action: undefined})
    } else if (params.action === "voice") {
      setVoiceModalOpen(true)
      router.setParams({ action: undefined})
    }
  }, [params.action, router])


  const onSubmit = async (values: TransactionFormValues) => {
    if(!user) return

    setError("")

    const parsed = parseAmount(values.amount)

    const {error: createError} = await createTransaction({
      user_id: user.id,
      account_id: values.acccountId,
      type: values.type,
      amount: parsed,
      category: values.category,
      description: values.description?.trim() || null,
      date: values.date.toISOString(),
      input_method: inputMethod,
      voice_transcript: inputMethod === "VOICE" ? voiceTranscript : null,
    })

    if (createError) {
      setError(t("addTransaction.saveFailed"))
      return
    }

    resetForm(DEFAULT_VALUES(accounts))
    setInputMethod("MANUAL")
    setVoiceTranscript(null)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(root)/(tabs)/transactions");
    }

  }

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <Text className="text-brand-bg text-xl font-semibold">
          {t("addTransaction.title")}
          </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >

        {loadingAccounts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#4A9EFF" />
         </View>
        ): accountsError ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-brand-text-muted text-sm mt-3 text-center">
              {t("profile.loadAccountsFailed")}
            </Text>
          </View>
        ): accounts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-brand-text-muted text-sm mt-3 text-center">
              {t("addTransaction.needAccount")}
            </Text>
          </View>
        ): (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 100,
            }}
          >
            {/* AI captute shorcuts */}
            <View className="flex-row gap-2.5 mb-4">
              <AIActionCard
                icon="camera"
                title={t("addTransaction.scanTitle")}
                subtitle={t("addTransaction.scanSubtitle")}
                colors={AI_GRADIENT}
                onPress={() => setScannerOpen(true)}
              />
              <AIActionCard
                icon="mic"
                title={t("addTransaction.voiceTitle")}
                subtitle={t("addTransaction.voiceSubtitle")}
                colors={AI_GRADIENT_REVERSE}
                onPress={() => setVoiceModalOpen(true)}
              />
            </View>

            {/* Type toggle */}
              <View className="flex-row bg-white rounded-xl border border-[#E8E6DF] p-1 mb-4">
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setValue("type", opt.key)
                  setValue(
                    "category",
                    opt.key === "INCOME"
                    ? INCOME_CATEGORIES[0].key
                    : EXPENSE_CATEGORIES[0].key
                  )
                }}
                className={`flex-1 py-2 rounded-lg items-center ${
                type === opt.key ? "bg-brand-bg" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      type === opt.key
                        ? "text-white"
                        : "text-brand-text-secondary"
                    }`}>
                      {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              {t("addTransaction.amount")}
            </Text>
            <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange, onBlur}}) => (
              <TextInput
              value={value}
              onChangeText={(v) => {
                setError("")
                onChange(v)
              }}
              onBlur={onBlur}
              placeholder="0"
              placeholderTextColor="#8A8D96"
              keyboardType="numeric"
              className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 text-sm text-brand-bg"
              />
              )}
            />
            {errors.amount && (
              <Text className="text-brand-coral text-xs mt-1.5">
                {t(errors.amount.message ?? "")}
              </Text>
            )}
            <View className="mb-4"/>

            {/* Category */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
            {t("addTransaction.category")}
            </Text>
            <View>
              <PillGroup
              options={categories.map((c) => ({
                key: c.key,
                label: getCategoryLabel(c.key),
                icon: c.icon,
              }))}
              value={category}
              onChange={(key) => setValue("category", key)}
              />
            </View>

              {/* Account */}
              <Text className="text-brand-bg text-xs font-medium mb-1.5">
                {t("addTransaction.account")}
              </Text>
              <View className="mb-1">
              <PillGroup
              options={accounts.map((a) => ({ key: a.id, label: a.name}))}
              value={accountId}
              onChange={(key) => setValue("acccountId", key)}
              />
              </View>
              {errors.acccountId && (
                <Text className="text-brand-coral text-xs mb-3">
                  {t(errors.acccountId.message ?? "")}
                </Text>
              )}
              <View className="mb-3"/>

              {/* Date */}
              <Text className="text-brand-bg text-xs font-medium mb-1.5">
                {t("addTransaction.date")}
              </Text>
              <TouchableOpacity
              onPress={() => setDatePickerOpen((v) => !v)}
               className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-1"
              >
                 <Text className="text-sm text-brand-bg">
                  {formatDate(date, "d MMM yyyy")}
                </Text>
                <Feather name="calendar" size={16} color="#5C5F68" />
              </TouchableOpacity>

              {datePickerOpen && (
                <View className="bg-white border border-[#E8E6DF] rounded-xl mb-4 overflow-hidden">
                  <CalendarPicker
                  value={date}
                  maximumDate={new Date()}
                  onChange={(selectedDate) => {
                    setValue("date", selectedDate)
                    setDatePickerOpen(false)
                  }}
                  />
                </View>
              )}
              {!datePickerOpen && <View className="mb-4"/>}

              {/* Description */}
              <Text className="text-brand-bg text-xs font-medium mb-1.5">
                {t("addTransaction.description")}
              </Text>
              <Controller
              control={control}
              name="description"
              render={({ field: {value, onChange, onBlur}}) => (
                <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t("addTransaction.descriptionPlaceholder")}
                placeholderTextColor="#8A8D96"
                className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4 text-sm text-brand-bg"
                />
              )}
              />

              {error ? (
                 <Text className="text-brand-coral text-xs mb-4">{error}</Text>
              ) : null}

              <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
              className="bg-brand-bg rounded-xl py-4 items-center mb-2"
              activeOpacity={0.85}
              >
                <Text className="text-white text-sm font-semibold">
                  {saving ? t("addTransaction.saving") : t("addTransaction.save")}
                </Text>
              </TouchableOpacity>
          </ScrollView>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>

      {scanning && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="bg-white rounded-2xl px-6 py-5 items-center">
            <ActivityIndicator color="#4A9EFF" />
            <Text className="text-brand-bg text-sm mt-3">{t("addTransaction.readingReceipt")}</Text>
          </View>
        </View>
      )}


      <VoiceRecorderModal
      visible={voiceModalOpen}
      onClose={() => setVoiceModalOpen(false)}
      onExtracted={handleVoiceExtracted}
      />


      <ReceiptScannerModal
      visible={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onCaptured={handleReceiptCaptured}
      />
    </SafeAreaView>
  )
}