import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"

type TransactionsErrorStateProps = {
    onRetry: () => void
}

export function TransactionsErrorState({ onRetry }: TransactionsErrorStateProps) {
    const { t } = useTranslation()

    return (
        <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-subtle text-sm mt-3 text-center">
                {t("transactions.loadError")}
            </Text>
            <TouchableOpacity
                onPress={() => onRetry()}
                className="mt-4 bg-solid rounded-full px-4 py-2"
            >
                <Text className="text-on-solid text-xs font-medium">{t("transactions.retry")}</Text>
            </TouchableOpacity>
        </View>
    )
}