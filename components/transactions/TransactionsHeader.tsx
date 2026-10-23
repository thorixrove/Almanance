import { useThemeColors } from "@/components/ThemeProvider"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"

type TransactionsHeaderProps = {
    selectionMode: boolean
    selectedCount: number
    bulkDeleting: boolean
    exporting: boolean
    onDeleteSelected: () => void
    onExitSelection: () => void
    onEnterSelection: () => void
    onExport: () => void
}

export function TransactionsHeader({
    selectionMode,
    selectedCount,
    bulkDeleting,
    exporting,
    onDeleteSelected,
    onExitSelection,
    onEnterSelection,
    onExport,
}: TransactionsHeaderProps) {
    const { t } = useTranslation()
    const colors = useThemeColors()

    return (
        <View className="flex-row items-center justify-between mb-3">
            <Text className="text-ink text-xl font-semibold">
                {selectionMode
                    ? t("transactions.selectedCount", { count: selectedCount })
                    : t("transactions.title")}
            </Text>

            {selectionMode ? (
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={onDeleteSelected}
                        disabled={selectedCount === 0 || bulkDeleting}
                        className={`w-9 h-9 rounded-full items-center justify-center ${selectedCount === 0 ? "bg-card border border-line" : "bg-brand-coral"
                            }`}
                    >
                        {bulkDeleting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Feather
                                name="trash-2"
                                size={15}
                                color={selectedCount === 0 ? "#8A8D96" : "#fff"}
                            />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onExitSelection}
                        className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
                    >
                        <Feather name="x" size={15} color={colors.icon} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                        onPress={onEnterSelection}
                        className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
                    >
                        <Feather name="check-square" size={15} color={colors.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onExport}
                        disabled={exporting}
                        className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
                    >
                        {exporting ? (
                            <ActivityIndicator size="small" color={colors.icon} />
                        ) : (
                            <Feather name="download" size={15} color={colors.icon} />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}