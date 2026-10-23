import { TransactionFormValues } from "@/lib/schemas/transaction";
import { formatAmountInput } from "@/lib/utils";
import { Control, Controller, FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

type AmountFieldProps = {
    control: Control<TransactionFormValues>
    error?: FieldError
    onInteract: () => void
}

export function AmountField({ control, error, onInteract }: AmountFieldProps) {
    const [t] = useTranslation()

    return (
        <>
            <Text className="text-ink text-xs font-medium leading-5 mb-1.5">
                {t("addTransaction.amount")}
            </Text>
            <Controller
                control={control}
                name="amount"
                render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                        value={value}
                        onChangeText={(v) => {
                            onInteract()
                            onChange(formatAmountInput(v))
                        }}
                        onBlur={onBlur}
                        placeholder="0"
                        placeholderTextColor="#8A8D96"
                        keyboardType="numeric"
                        className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink"
                    />
                )}
            />
            {error && (
                <Text className="text-brand-coral text-xs mt-1.5">
                    {t(error.message ?? "")}
                </Text>
            )}
            <View className="mb-4" />
        </>
    )
}