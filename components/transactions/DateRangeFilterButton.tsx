import { useThemeColors } from "@/components/ThemeProvider"
import { DateRange, formatRangeLabel } from "@/lib/utils/dateRange"
import { Feather } from "@expo/vector-icons"
import { Text, TouchableOpacity, View } from "react-native"

type DateRangeFilterButtonProps = {
    dateRange: DateRange
    rangeActive: boolean
    onOpen: () => void
    onReset: () => void
}

export function DateRangeFilterButton({
    dateRange,
    rangeActive,
    onOpen,
    onReset,
}: DateRangeFilterButtonProps) {
    const colors = useThemeColors()

    return (
        <View className="flex-row items-center gap-2 mt-2.5">
            <TouchableOpacity
                onPress={onOpen}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${rangeActive ? "bg-solid border-solid" : "bg-card border-line"
                    }`}
            >
                <Feather
                    name="calendar"
                    size={12}
                    color={rangeActive ? colors.onSolid : colors.icon}
                />
                <Text
                    className={`text-xs ${rangeActive ? "text-on-solid" : "text-brand-text-secondary"
                        }`}
                >
                    {formatRangeLabel(dateRange)}
                </Text>
            </TouchableOpacity>
            {rangeActive && (
                <TouchableOpacity
                    onPress={onReset}
                    className="w-7 h-7 rounded-full bg-card border border-line items-center justify-center"
                >
                    <Feather name="x" size={13} color="#8A8D96" />
                </TouchableOpacity>
            )}
        </View>
    )
}