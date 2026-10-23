import { TransactionFormValues } from "@/lib/schemas/transaction";
import { Control, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text, TextInput } from "react-native";

type DescriptionFieldProps = {
    control: Control<TransactionFormValues>
}

export function DescriptionField({ control }: DescriptionFieldProps) {
    const { t } = useTranslation()

    return (
        <>
            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("addTransaction.description")}
            </Text>
            <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder={t("addTransaction.descriptionPlaceholder")}
                        placeholderTextColor="#8A8D96"
                        className="bg-card border border-line rounded-xl px-4 py-3.5 mb-4 text-sm text-ink"
                    />
                )}
            />
        </>
    )
}
