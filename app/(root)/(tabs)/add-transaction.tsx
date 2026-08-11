// import { AIActionCard } from "@/components/AIActionCard";
// import { CalendarPicker } from "@/components/CalendarPicker";
// import { PillGroup } from "@/components/PillGroup";
// import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
// import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
// import {
//   CategoryKey,
//   EXPENSE_CATEGORIES,
//   INCOME_CATEGORIES,
// } from "@/constants/categories";
// import { useCreateTransaction } from "@/hooks/mutations/useTransactionMutations";
import { CategoryKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import { useCreateTransactions } from "@/hooks/mutation/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
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
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
  const {user} = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{action?: string}>()

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = useAccountsQuery()
  const { mutateAsync: createTransaction, isPending: saving} =
  useCreateTransactions()

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

  const categories = type === "INCOME" ? "INCOME_CATEGORIES" : EXPENSE_CATEGORIES

  useEffect(() => {
    if (accounts.length > 0) resetForm(DEFAULT_VALUES(accounts))
  }, [accounts, resetForm])



  return (
    <View>
      <Text> AddTransaction</Text>
    </View>
  )
}