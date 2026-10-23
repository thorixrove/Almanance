
import { CalendarPicker } from "@/components/CalendarPicker";
import { useThemeColors } from "@/components/ThemeProvider";
import { formatDate } from "@/lib/i18n/dateLocale";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

type DateFieldProps = {
    date: Date
    open: boolean
    onToggle: () => void
    onChange: (date: Date) => void
}

export function DateField({ date, open, onToggle, onChange }: DateFieldProps) {
    const { t } = useTranslation()
    const colors = useThemeColors()

    return (
        <>
            <Text className="text-ink text-xs font-medium leading-6 mb-1.5">
                {t("addTransaction.date")}
            </Text>
            <TouchableOpacity
                onPress={onToggle}
                className="flex-row items-center justify-between bg-card border border-line rounded-xl px-4 py-3.5 mb-1"
            >
                <Text className="text-sm text-ink">
                    {formatDate(date, "d MMM yyyy")}
                </Text>
                <Feather name="calendar" size={16} color={colors.icon} />
            </TouchableOpacity>

            {open && (
                <View className="bg-card border border-line rounded-xl mb-4 overflow-hidden">
                    <CalendarPicker
                        value={date}
                        maximumDate={new Date()}
                        onChange={onChange}
                    />
                </View>
            )}
            {!open && <View className="mb-4" />}
        </>
    )
}