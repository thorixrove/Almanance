import {
  CategoryKey,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants/categories"
import { COLORS } from "@/constants/theme"
import { useUpdateTransaction } from "@/hooks/mutation/useTransactionMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import type {
  Transaction,
  TransactionType,
  UpdateTransactionPayload,
} from "@/lib/services/transactions"
import { parseAmount } from "@/lib/utils"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { Text, TextInput, TouchableOpacity, View } from "react-native"
import { BottomSheet } from "./BottomSheet"
import { CalendarPicker } from "./CalendarPicker"
import { PillGroup } from "./PillGroup"

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
]

// Nominal dari database bisa berupa desimal (mis. 15000.5). Dibuat 2 digit
// desimal supaya parseAmount tidak salah mengira "1500.123" sebagai ribuan.
function amountToInput(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSaved,
}: {
  visible: boolean
  transaction: Transaction | null
  onClose: () => void
  onSaved: () => void
}) {
  const { data: accounts = [] } = useAccountsQuery()
  const { mutateAsync: updateTransaction, isPending: saving } =
    useUpdateTransaction()

  const [type, setType] = useState<TransactionType>("EXPENSE")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<CategoryKey>("food")
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState(new Date())
  const [description, setDescription] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [error, setError] = useState("")

  // Isi ulang form setiap kali modal dibuka untuk transaksi tertentu.
  useEffect(() => {
    if (visible && transaction) {
      setType(transaction.type)
      setAmount(amountToInput(transaction.amount))
      setCategory(transaction.category)
      setAccountId(transaction.account_id)
      setDate(new Date(transaction.date))
      setDescription(transaction.description ?? "")
      setDatePickerOpen(false)
      setError("")
    }
  }, [visible, transaction])

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    const list = next === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    // Kategori lama tidak berlaku di tipe baru, jadi pakai kategori pertama.
    if (!list.some((c) => c.key === category)) setCategory(list[0].key)
  }

  const handleSave = async () => {
    if (!transaction) return

    const parsedAmount = parseAmount(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.")
      return
    }
    if (!accountId) {
      setError("Select an account.")
      return
    }

    // Kirim hanya field yang benar-benar berubah.
    const payload: UpdateTransactionPayload = {}
    if (type !== transaction.type) payload.type = type
    if (parsedAmount !== transaction.amount) payload.amount = parsedAmount
    if (category !== transaction.category) payload.category = category
    if (accountId !== transaction.account_id) payload.account_id = accountId
    const nextDescription = description.trim() || null
    if (nextDescription !== (transaction.description ?? null)) {
      payload.description = nextDescription
    }
    if (date.getTime() !== new Date(transaction.date).getTime()) {
      payload.date = date.toISOString()
    }

    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setError("")
    try {
      const result = await updateTransaction({ id: transaction.id, payload })
      if (result.error) {
        console.error("Error updating transaction:", result.error)
        setError("Something went wrong. Please try again.")
        return
      }
      onSaved()
    } catch (e) {
      console.error("Error updating transaction:", e)
      setError("Something went wrong. Please try again.")
    }
  }

  const footer = (
    <>
      {error ? (
        <Text className="text-brand-coral text-xs mb-3">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-brand-bg rounded-xl py-4 items-center"
        activeOpacity={0.85}
      >
        <Text className="text-white text-sm font-semibold">
          {saving ? "Saving…" : "Save changes"}
        </Text>
      </TouchableOpacity>
    </>
  )

  return (
    <BottomSheet
      visible={visible}
      title="Edit transaction"
      onClose={onClose}
      footer={footer}
    >
        {/* Type */}
        <View className="flex-row bg-white rounded-xl border border-[#E8E6DF] p-1 mb-4">
          {TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => handleTypeChange(t.key)}
              className={`flex-1 py-2 rounded-lg items-center ${
                type === t.key ? "bg-brand-bg" : ""
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  type === t.key ? "text-white" : "text-brand-text-secondary"
                }`}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text className="text-brand-bg text-xs font-medium mb-1.5">Amount</Text>
        <TextInput
          value={amount}
          onChangeText={(v) => {
            setError("")
            setAmount(v)
          }}
          placeholder="0"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="numeric"
          className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4 text-sm text-brand-bg"
        />

        {/* Category */}
        <Text className="text-brand-bg text-xs font-medium mb-1.5">
          Category
        </Text>
        <View className="mb-4">
          <PillGroup
            options={categories.map((c) => ({
              key: c.key,
              label: c.label,
              icon: c.icon,
            }))}
            value={category}
            onChange={setCategory}
          />
        </View>

        {/* Account */}
        <Text className="text-brand-bg text-xs font-medium mb-1.5">Account</Text>
        <View className="mb-4">
          <PillGroup
            options={accounts.map((a) => ({ key: a.id, label: a.name }))}
            value={accountId}
            onChange={setAccountId}
          />
        </View>

        {/* Date */}
        <Text className="text-brand-bg text-xs font-medium mb-1.5">Date</Text>
        <TouchableOpacity
          onPress={() => setDatePickerOpen((v) => !v)}
          className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4"
        >
          <Text className="text-sm text-brand-bg">
            {format(date, "d MMM yyyy")}
          </Text>
          <Feather name="calendar" size={16} color="#5C5F68" />
        </TouchableOpacity>

        {datePickerOpen && (
          <View className="bg-white border border-[#E8E6DF] rounded-xl mb-4 overflow-hidden">
            <CalendarPicker
              value={date}
              maximumDate={new Date()}
              onChange={(selected) => {
                setDate(selected)
                setDatePickerOpen(false)
              }}
            />
          </View>
        )}

        {/* Description */}
        <Text className="text-brand-bg text-xs font-medium mb-1.5">
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Lunch at warung"
          placeholderTextColor={COLORS.placeholder}
          className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4 text-sm text-brand-bg"
        />
    </BottomSheet>
  )
}