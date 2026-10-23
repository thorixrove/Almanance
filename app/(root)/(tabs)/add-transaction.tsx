import { AccountField } from "@/components/add-transaction/AccountField";
import { AddTransactionAICards } from "@/components/add-transaction/AddTransactionAICards";
import { AmountField } from "@/components/add-transaction/AmountField";
import { CategoryField } from "@/components/add-transaction/CategoryField";
import { DateField } from "@/components/add-transaction/DateField";
import { DescriptionField } from "@/components/add-transaction/DescriptionField";
import { ScanningOverlay } from "@/components/add-transaction/ScanningOverlay";
import { TransactionTypeToggle } from "@/components/add-transaction/TransactionTypeToggle";
import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
import { CategoryKey } from "@/constants/categories";
import { useCreateTransactions } from "@/hooks/mutation/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useCategories } from "@/hooks/useCategories";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
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
import { amountToInput, parseAmount } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValid } from "date-fns";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const DEFAULT_VALUES = (accounts: Account[]): TransactionFormValues => ({
  type: "EXPENSE",
  amount: "",
  category: "food",
  acccountId: accounts[0]?.id ?? "",
  description: "",
  date: new Date(),
})



export default function AddTransaction() {
  const { user } = useUser()
  const { t } = useTranslation()
  const router = useRouter()
  const params = useLocalSearchParams<{ action?: string }>()
  const keyboardHeight = useKeyboardHeight()

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountError,
  } = useAccountsQuery()

  const { mutateAsync: createTransaction, isPending: saving } = useCreateTransactions()

  const supabase = useSupabase()
  const [error, setError] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL")
  const [voiceTransacript, setVoiceTransacript] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    clearErrors,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: DEFAULT_VALUES([])
  })

  useFocusEffect(
    useCallback(() => {
      return () => clearErrors()
    }, [clearErrors])
  )

  const type = watch("type")
  const category = watch("category")
  const accountId = watch("acccountId")
  const date = watch("date")

  const { expense: expenseCategories, income: incomeCategories } = useCategories()
  const categories = type === "INCOME" ? incomeCategories : expenseCategories

  useEffect(() => {
    if (!categories.some((c) => c.key === category)) {
      setValue("category", categories[0].key)
    }
  }, [categories, category, setValue])

  useEffect(() => {
    if (accounts.length > 0) resetForm(DEFAULT_VALUES(accounts))
  }, [accounts, resetForm])

  const applyExtraction = (result: ExtractedTransaction) => {
    const categoryList =
      result.type === "INCOME" ? incomeCategories : expenseCategories
    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categoryList.some((c) => c.key === key)


    if (result.type) setValue("type", result.type)
    if (isValidCategory(result.category)) setValue("category", result.category)
    if (result.amount != null) setValue("amount", amountToInput(Number(result.amount)))
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

  const handleReceiptCaptured = async (uri: string, mimeType: string) => {
    setScannerOpen(false)
    setScanning(true)
    try {
      const extracted = await extractTransactionFromReceipt(supabase, uri, mimeType)
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
    setVoiceTransacript(result.transcript)
    setInputMethod("VOICE")
  }

  useEffect(() => {
    if (params.action === "scan") {
      setScannerOpen(true)
      router.setParams({ action: undefined })
    } else if (params.action === "voice") {
      setVoiceModalOpen(true)
      router.setParams({ action: undefined })
    }
  }, [params.action, router])

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) return

    setError("")

    const parsed = parseAmount(values.amount)

    const { error: createError } = await createTransaction({
      user_id: user.id,
      account_id: values.acccountId,
      type: values.type,
      amount: parsed,
      category: values.category,
      description: values.description?.trim() || null,
      date: values.date.toISOString(),
      input_method: inputMethod,
      voice_transcript: inputMethod === "VOICE" ? voiceTransacript : null,
    })

    if (createError) {
      setError(t("addTransaction.saveFailed"))
      return
    }


    resetForm(DEFAULT_VALUES(accounts))
    setInputMethod("MANUAL")
    setVoiceTransacript(null)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(root)/(tabs)/transactions");
    }

  }


  const handleSelectType = (key: "EXPENSE" | "INCOME") => {
    setValue("type", key)
    setValue(
      "category",
      key === "INCOME"
        ? incomeCategories[0].key
        : expenseCategories[0].key
    )
  }


  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <Text className="text-ink text-xl font-semibold">
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
        ) : accountError ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-subtle text-sm mt-3 text-center">
              {t("profile.loadAccountsFailed")}
            </Text>
          </View>
        ) : accounts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-subtle text-sm mt-3 text-center">
              {t("addTransaction.needAccount")}
            </Text>
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 100,
              }}
            >


              <AddTransactionAICards
                onScan={() => setScannerOpen(true)}
                onVoice={() => setVoiceModalOpen(true)}
              />


              <TransactionTypeToggle value={type} onChange={handleSelectType} />

              <AmountField
                control={control}
                error={errors.amount}
                onInteract={() => setError("")}
              />

              <CategoryField
                categories={categories}
                value={category}
                onChange={(key) => setValue("category", key)}
              />

              <AccountField
                accounts={accounts}
                value={accountId}
                onChange={(key) => setValue("acccountId", key)}
                error={errors.acccountId}
              />

              <DateField
                date={date}
                open={datePickerOpen}
                onToggle={() => setDatePickerOpen((v) => !v)}
                onChange={(selectedDate) => {
                  setValue("date", selectedDate)
                  setDatePickerOpen(false)
                }}
              />


              <DescriptionField control={control} />

              {error ? (
                <Text className="text-brand-coral text-xs mb-4">{error}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={saving}
                className="bg-solid rounded-xl py-4 items-center mb-2"
                activeOpacity={0.85}
              >
                <Text className="text-on-solid text-sm font-semibold">
                  {saving ? t("addTransaction.saving") : t("addTransaction.save")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>

      {scanning && (
        <ScanningOverlay />
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