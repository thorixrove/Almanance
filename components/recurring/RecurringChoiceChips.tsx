import { useThemeColors } from "@/components/ThemeProvider"
import { Text, TouchableOpacity, View } from "react-native"

export type ChoiceOption = { key: string; label: string }

export function RecurringChoiceChips({
    options,
    selected,
    onSelect
}: {
    options: ChoiceOption[]
    selected: string | null
    onSelect: (key: string) => void
}) {
    const colors = useThemeColors()

    return (
        <View className="flex-row flex-wrap gap-2 mb-5">
            {options.map((option) => {
                const isSelected = selected === option.key
                return(
                    <TouchableOpacity
                        key={option.key}
                        onPress={() => onSelect(option.key)}
                        className="rounded-full px-3.5 py-2 border"
                        style={{
                            borderColor: isSelected ? colors.ink : colors.line,
                            backgroundColor: colors.card,
                            borderWidth: isSelected ? 1.5 : 1,
                        }}
                    >
                        <Text className="text-ink text-xs font-medium">{option.label}</Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}