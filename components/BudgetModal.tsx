import { useUpsertBudget } from "@/hooks/mutation/useBudgetMutations"
import {Budget} from "@/lib/services/budgets"
import { COLORS } from "@/constants/theme"
import { parseAmount } from "@/lib/utils"
import { BottomSheet } from "./BottomSheet"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, TextInput, TouchableOpacity } from "react-native";


export function BudgetModal({
  visible,
  budget,
  onClose,
  onSaved,
} : {
  visible: boolean
  budget: Budget | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const {mutateAsync: upsertBudget, isPending: saving} = useUpsertBudget()

  useEffect(() => {
    if (visible) {
      setAmount(budget ? String(budget.amount): "")
      setError("")
    }
  }, [visible, budget])

  const handleSave = async () => {
    const parsedAmount = parseAmount(amount)
    
    if(!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("budget.invalid"))
      return
    }

    setError("")
    try {
      await upsertBudget(parsedAmount)
      onSaved()
    } catch (error) {
      console.error("Error saving budget:", error)
      setError(t("addTransaction.saveFailed"))
    }
  }

  return(
        <BottomSheet
      visible={visible}
      title={budget ? t("budget.editTitle") : t("budget.setTitle")}
      onClose={onClose}
    >
      <Text className="text-ink text-xs font-medium mb-1.5">
        {t("home.monthlyBudget")}
      </Text>
      <TextInput
        value={amount}
        onChangeText={(v) => {
          setError("");
          setAmount(v);
        }}
        placeholder={t("budget.placeholder")}
        placeholderTextColor={COLORS.placeholder}
        keyboardType="numeric"
        autoFocus
        className="bg-card border border-line rounded-xl px-4 py-3.5 mb-5 text-sm text-ink"
      />

      {error ? (
        <Text className="text-brand-coral text-xs mb-3">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-solid rounded-xl py-4 items-center mb-3"
        activeOpacity={0.85}
      >
        <Text className="text-on-solid text-sm font-semibold">
          {saving ? t("common.saving") : t("budget.save")}
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  )
}