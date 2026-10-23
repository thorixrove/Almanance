import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"

export const FILTERS = ["ALL", "Income", "Expense"] as const

const FILTER_LABEL_KEYS = {
    ALL: "transactions.filterAll",
    Income: "transactions.filterIncome",
    Expense: "transactions.filterExpense",
} as const

type TransactionTypeFilterProps = {
    activeFilter: (typeof FILTERS)[number]
    onChange: (filter: (typeof FILTERS)[number]) => void
}

export function TransactionTypeFilter({ activeFilter, onChange }: TransactionTypeFilterProps) {
    const { t } = useTranslation()

    return (
        <View className="flex-row gap-2 mb-2.5">
            {FILTERS.map((filter) => (
                <TouchableOpacity
                    key={filter}
                    onPress={() => onChange(filter)}
                    className={`px-3.5 py-1.5 rounded-full border ${activeFilter === filter
                        ? "bg-solid border-solid"
                        : "bg-card border-line"
                        }`}
                >
                    <Text
                        className={`text-xs ${activeFilter === filter
                            ? "text-on-solid"
                            : "text-brand-text-secondary"
                            }`}
                    >
                        {t(FILTER_LABEL_KEYS[filter])}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}