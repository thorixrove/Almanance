import { useThemeColors } from "@/components/ThemeProvider"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"


type TransactionEmptyStateProps = {
    hasSearch: boolean
    rangeActive: boolean
}

export function TransactionsEmptyState({ hasSearch, rangeActive }: TransactionEmptyStateProps) {
    const { t } = useTranslation()
    const colors = useThemeColors()

    return (
        <View className="items-center justify-center py-20">
            <Feather name="inbox" size={32} color={colors.subtle} />
            <Text className="text-subtle text-sm mt-3">
                {hasSearch
                    ? t("transactions.emptySearch")
                    : rangeActive
                        ? t("transactions.emptyRange")
                        : t("transactions.empty")}
            </Text>
        </View>
    )
}