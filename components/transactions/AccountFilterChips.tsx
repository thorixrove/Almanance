import { Account } from "@/lib/services/accounts"
import { useTranslation } from "react-i18next"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"

type AccountFilterChipsProps = {
    accounts: Account[]
    activeAccountId: string | null
    onChange: (accountId: string | null) => void
}

export function AccountFilterChips({ accounts, activeAccountId, onChange }: AccountFilterChipsProps) {
    const { t } = useTranslation()

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => onChange(null)}
                    className={`px-3.5 py-1.5 rounded-full border ${activeAccountId === null
                            ? "bg-solid border-solid"
                            : "bg-card border-line"
                        }`}
                >
                    <Text
                        className={`text-xs ${activeAccountId === null
                                ? "text-on-solid"
                                : "text-brand-text-secondary"
                            }`}
                    >
                        {t("transactions.allAccounts")}
                    </Text>
                </TouchableOpacity>
                {accounts.map((accounts) => (
                    <TouchableOpacity
                        key={accounts.id}
                        onPress={() => onChange(accounts.id)}
                        className={`px-3.5 py-1.5 rounded-full border ${activeAccountId === accounts.id
                                ? "bg-solid border-solid"
                                : "bg-card border-line"
                            }`}
                    >
                        <Text
                            className={`text-xs ${activeAccountId === accounts.id
                                    ? "text-on-solid"
                                    : "text-brand-text-secondary"
                                }`}
                        >
                            {accounts.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    )
}