import { useThemeColors } from "@/components/ThemeProvider"
import { formatDate } from "@/lib/i18n/dateLocale"
import { Feather } from "@expo/vector-icons"
import { Text, TouchableOpacity, View } from "react-native"
import { CalendarPicker } from "@/components/CalendarPicker"

// Label + tombol tanggal + kalender. Status buka/tutup diatur induk (open, onToggle)
// supaya induk bisa menutup kalender saat sheet dibuka ulang.
// Bila onClear diberikan, muncul tombol X saat ada tanggal terpilih.
export function RecurringDateField({
    label,
    value,
    pickerValue,
    placeholder,
    clearLabel,
    open,
    onToggle,
    onChange,
    onClear,
    className,
}: {
    label: string
    value: Date | null
    pickerValue?: Date
    placeholder?: string
    clearLabel?: string
    open: boolean
    onToggle: () => void
    onChange: (date: Date) => void
    onClear?: () => void
    className?: string
}) {
    const colors = useThemeColors()

    return (
        <View className={className}>
            <Text className="text-ink text-xs font-medium mb-1.5">{label}</Text>

            <View className="flex-row items-center gap-2 mb-1.5">
                <TouchableOpacity
                    onPress={onToggle}
                    className="flex-1 flex-row items-center justify-between bg-card border border-line rounded-xl px-4 py-3.5"
                >
                    <Text className={`text-sm ${value ? "text-ink" : "text-subtle"}`}>
                        {value ? formatDate(value, "d MMMM yyyy") : placeholder}
                    </Text>
                    <Feather name="calendar" size={16} color={colors.icon} />
                </TouchableOpacity>

                {onClear && value && (
                    <TouchableOpacity
                        onPress={onClear}
                        hitSlop={8}
                        accessibilityLabel={clearLabel}
                        className="w-11 h-11 rounded-xl bg-card border border-line items-center justify-center"
                    >
                        <Feather name="x" size={16} color={colors.icon} />
                    </TouchableOpacity>
                )}
            </View>

            {open && (
                <View className="bg-card border border-line rounded-xl mb-1.5 overflow-hidden">
                    <CalendarPicker value={value ?? pickerValue ?? new Date()} onChange={onChange} />
                </View>
            )}
        </View>
    )
}