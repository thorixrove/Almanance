import { PillGroup } from "@/components/PillGroup";
import { Account } from "@/lib/services/accounts";
import { FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type AccountFieldProps = {
    accounts: Account[]
    value: string
    onChange: (key: string) => void
    error?: FieldError
}

export function AccountField({ accounts, value, onChange, error }: AccountFieldProps) {
    const { t } = useTranslation()

    return (
        <>
            <Text className="text-ink text-xs font-medium leading-6 mb-1.5">
                {t("addTransaction.account")}
            </Text>
            <View className="mb-1">
                <PillGroup
                    options={accounts.map((a) => ({ key: a.id, label: a.name }))}
                    value={value}
                    onChange={onChange}
                />
            </View>
            {error && (
                <Text className="text-brand-coral text-xs mb-3">
                    {t(error.message ?? "")}
                </Text>
            )}
            <View className="mb-3" />
        </>
    )
}