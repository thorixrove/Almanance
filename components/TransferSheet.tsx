import { COLORS } from "@/constants/theme"
import { useCreateTransfer } from "@/hooks/mutation/useTransferMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { formatPrice, parseAmount } from "@/lib/utils"
import { useUserStore } from "@/store/useStore"
import { Feather } from "@expo/vector-icons"
import { formatDate } from "@/lib/i18n/dateLocale"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Text, TextInput, TouchableOpacity, View } from "react-native"
import { BottomSheet } from "./BottomSheet"
import { CalendarPicker } from "./CalendarPicker"
import { PillGroup } from "./PillGroup"

export function TransferSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const currency = useUserStore((s) => s.currency)
  const { data: accounts = [] } = useAccountsQuery()
  const { mutateAsync: createTransfer, isPending: saving } = useCreateTransfer()

  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date())
  const [note, setNote] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [error, setError] = useState("")

  const fromAccount = accounts.find((a) => a.id === fromId)
  const toAccount = accounts.find((a) => a.id === toId)

  // Reset form setiap kali sheet dibuka: asal = akun default, tujuan = akun lain pertama.
  useEffect(() => {
    if (!visible) return
    const from = accounts.find((a) => a.is_default) ?? accounts[0]
    const to = accounts.find((a) => a.id !== from?.id)
    setFromId(from?.id ?? "")
    setToId(to?.id ?? "")
    setAmount("")
    setDate(new Date())
    setNote("")
    setDatePickerOpen(false)
    setError("")
    // Sengaja hanya bergantung pada `visible`: form di-reset saat sheet dibuka,
    // bukan setiap kali data akun di-refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleFromChange = (id: string) => {
    setError("")
    setFromId(id)
    // Akun tujuan tidak boleh sama dengan akun asal.
    if (id === toId) {
      setToId(accounts.find((a) => a.id !== id)?.id ?? "")
    }
  }

 

  const handleSave = async () => {
    const parsedAmount = parseAmount(amount)
    if (!fromId || !toId) {
      setError(t("transfer.selectBoth"))
      return
    }
    if (fromId === toId) {
      setError(t("transfer.sameAccount"))
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("addTransaction.enterValidAmount"))
      return
    }

    setError("")
    try {
      const result = await createTransfer({
        fromAccountId: fromId,
        toAccountId: toId,
        amount: parsedAmount,
        date: date.toISOString(),
        note: note.trim() || null,
      })
      if (result.error) {
        console.error("Error creating transfer:", result.error)
        setError(t("addTransaction.saveFailed"))
        return
      }
      onSaved()
    } catch (e) {
      console.error("Error creating transfer:", e)
      setError(t("addTransaction.saveFailed"))
    }
  }

  const notEnoughAccounts = accounts.length < 2

  const footer = notEnoughAccounts ? undefined : (
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
          {saving ? t("transfer.transferring") : t("transfer.action")}
        </Text>
      </TouchableOpacity>
    </>
  )

  return (
    <BottomSheet
      visible={visible}
      title={t("transfer.title")}
      onClose={onClose}
      footer={footer}
    >
      {notEnoughAccounts ? (
        <Text className="text-brand-text-secondary text-sm mb-2">
          {t("transfer.needTwoAccounts")}
        </Text>
      ) : (
        <>
          {/* From */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">{t("transfer.from")}</Text>
          <View className="mb-1.5">
            <PillGroup
              options={accounts.map((a) => ({ key: a.id, label: a.name }))}
              value={fromId}
              onChange={handleFromChange}
            />
          </View>
          {fromAccount && (
            <Text className="text-brand-text-secondary text-[11px] mb-3">
              {t("transfer.balance", { amount: formatPrice(fromAccount.balance, currency) })}
            </Text>
          )}

          {/* To */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">{t("transfer.to")}</Text>
          <View className="mb-1.5">
            <PillGroup
              options={accounts
                .filter((a) => a.id !== fromId)
                .map((a) => ({ key: a.id, label: a.name }))}
              value={toId}
              onChange={(id) => {
                setError("")
                setToId(id)
              }}
            />
          </View>
          {toAccount && (
            <Text className="text-brand-text-secondary text-[11px] mb-4">
              {t("transfer.balance", { amount: formatPrice(toAccount.balance, currency) })}
            </Text>
          )}

          {/* Amount */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">{t("addTransaction.amount")}</Text>
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

          {/* Date */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">{t("addTransaction.date")}</Text>
          <TouchableOpacity
            onPress={() => setDatePickerOpen((v) => !v)}
            className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4"
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
                onChange={(selected) => {
                  setDate(selected)
                  setDatePickerOpen(false)
                }}
              />
            </View>
          )}

          {/* Note */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">
            {t("transfer.note")}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("transfer.notePlaceholder")}
            placeholderTextColor={COLORS.placeholder}
            className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4 text-sm text-brand-bg"
          />
        </>
      )}
    </BottomSheet>
  )
}