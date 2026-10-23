import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";


const TYPE_OPTIONS = [
    { key: "EXPENSE" as const, labelKey: "transactions.expense" },
    { key: "INCOME" as const, labelKey: "transactions.income" },
]


type TransactionTypeToggleProps = {
    value: (typeof TYPE_OPTIONS)[number]["key"]
    onChange: (key: (typeof TYPE_OPTIONS)[number]["key"]) => void
}

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
    const { t } = useTranslation()

    return (
        <View className="flex-row bg-card rounded-xl border border-line p-1 mb-4">
            {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                    key={opt.key}
                    onPress={() => onChange(opt.key)}
                    className={`flex-1 py-2 rounded-lg items-center ${value === opt.key ? "bg-solid" : ""
                        }`}
                >
                    <Text
                        className={`text-xs font-medium ${value === opt.key
                            ? "text-on-solid"
                            : "text-brand-text-secondary"
                            }`}
                    >
                        {t(opt.labelKey)}
                    </Text>
                </TouchableOpacity>
            ))
            }
        </View >
    )
}