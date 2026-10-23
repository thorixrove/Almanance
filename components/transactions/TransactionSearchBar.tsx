import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { TextInput, TouchableOpacity, View } from "react-native"

type TransactionSearchBarProps = {
    value: string
    onChangeText: (value: string) => void
}

export function TransactionSearchBar({ value, onChangeText }: TransactionSearchBarProps) {
    const { t } = useTranslation()

    return (
        <View className="flex-row items-center gap-2 bg-card rounded-xl border border-line px-3.5 py-2.5 mb-2.5">
            <Feather name="search" size={15} color="#8A8D96" />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={t("transactions.searchPlaceholder")}
                placeholderTextColor="#8A8D96"
                className="flex-1 text-xs text-ink"
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText("")}>
                    <Feather name="x" size={15} color="#8A8D96" />
                </TouchableOpacity>
            )}
        </View>
    )
}