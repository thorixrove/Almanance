import { COLORS } from "@/constants/theme"
import { Feather } from "@expo/vector-icons"
import cc from "currency-codes"
import getSymbol from "currency-symbol-map"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native"
import { BottomSheet } from "./BottomSheet"

export type CurrencyEntry = { code: string; name: string; symbol: string }

export const ALL_CURRENCIES: CurrencyEntry[] = cc
    .codes()
    .map((code) => ({
        code,
        name: cc.code(code)?.currency ?? code,
        symbol: getSymbol(code) ?? code,
    }))
    .filter((c) => c.symbol !== c.code)

export function CurrencyPicker({
    visible,
    selectedCode,
    onSelect,
    onClose,
}: {
    visible: boolean,
    selectedCode: string,
    onSelect: (currency: CurrencyEntry) => void
    onClose: () => void
}) {
    const { t } = useTranslation()
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (!visible) setSearch("")
    }, [visible])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return ALL_CURRENCIES
        return ALL_CURRENCIES.filter(
            (c) =>
                c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        )
    }, [search])

    return (
        <BottomSheet visible={visible}
            title={t("profile.currency")}
            onClose={onClose}
            scrollable={false}>
            <TextInput value={search}
                onChangeText={setSearch}
                placeholder={t("currencyPicker.search")}
                placeholderTextColor={COLORS.placeholder}
                autoCorrect={false}
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-2"
            />
            <FlatList
                style={{ flex: 1 }}
                data={filtered}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => onSelect(item)}
                        className="flex-row items-center py-3.5 border-b border-line-soft"
                    >
                        <Text className="text-brand-text-secondary w-11 text-sm">
                            {item.symbol}
                        </Text>
                        <Text className="text-ink text-sm font-medium w-12">
                            {item.code}
                        </Text>
                        <Text
                            className="text-brand-text-secondary text-sm flex-1"
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                        {item.code === selectedCode && (
                            <Feather name="check" size={16} color="#4A9EFF" />
                        )}
                    </TouchableOpacity>
                )}
            />
        </BottomSheet>
    )
}