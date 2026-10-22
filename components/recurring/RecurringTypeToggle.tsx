import type { TransactionType } from "@/types/transaction"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"

const OPTIONS: TransactionType[] = ["EXPENSE", "INCOME"]

export function RecurringTypeToggle({
    value,
    locked,
    onChange
}: {
    value: TransactionType
    locked: boolean
    onChange: (next: TransactionType) => void
}) {
    const { t } = useTranslation()

    return (
        <View className="flex-row bg-card border border-line rounded-xl p-1 mb-5">
            {OPTIONS.map((option) => {
                const selected = value === option
                return (
                    <TouchableOpacity
                        key={option}
                        onPress={() => !locked && onChange(option)}
                        disabled={locked && !selected}
                        className={`flex-1 py-2.5 rounded-lg items-center ${selected ? "bg-solid" : ""}`}
                        style={{ opacity: locked && !selected ? 0.4 : 1 }}
                    >
                        <Text className={`text-xs font-semibold ${selected ? "text-on-solid" : "text-ink"}`}>
                            {option === "EXPENSE"
                                ? t("recurring.typeExpense")
                                : t("recurring.typeIncome")
                            }
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}