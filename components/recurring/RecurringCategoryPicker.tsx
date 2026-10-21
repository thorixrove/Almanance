import { useThemeColors } from "@/components/ThemeProvider"
import type { CategoryInfo } from "@/lib/utils/categories"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"

export function RecurringCategoryPicker({
    items,
    selectedKey,
    loading,
    failed,
    onSelect,
    onRetry,
}: {
    items: CategoryInfo[]
    selectedKey: string | null
    loading: boolean
    failed: boolean
    onSelect: (key: string) => void
    onRetry: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()

    if (loading) {
        return (
            <View className="py-6 items-center mb-5">
                <ActivityIndicator color={colors.icon} />
            </View>
        )
    }

    if (failed) {
        return (
            <View className="items-center py-4 mb-5">
                <Text className="text-subtle text-sm mb-2">{t("categoryBudget.loadFailed")}</Text>
                <TouchableOpacity onPress={onRetry} hitSlop={8}>
                    <Text className="text-ink text-sm font-semibold">{t("recurring.retry")}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View className="flex-row flex-wrap gap-2 mb-5">
            {items.map((c) => {
                const selected = selectedKey === c.key
                return (
                    <TouchableOpacity
                        key={c.key}
                        onPress={() => onSelect(c.key)}
                        className="flex-row items-center rounded-full px-3 py-2 border"
                        style={{
                            borderColor: selected ? c.color : colors.line,
                            backgroundColor: selected ? `${c.color}22` : colors.card,
                            borderWidth: selected ? 1.5 : 1,
                        }}
                    >
                        <Text className="text-base mr-1.5">{c.icon}</Text>
                        <Text className="text-ink text-xs font-medium">{c.label}</Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}