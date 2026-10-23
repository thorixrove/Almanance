import { PillGroup } from "@/components/PillGroup";
import { CategoryKey } from "@/constants/categories";
import { useCategories } from "@/hooks/useCategories";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type CategoryFieldProps = {
    categories: ReturnType<typeof useCategories>["expense"]
    value: CategoryKey
    onChange: (key: CategoryKey) => void
}

export function CategoryField({ categories, value, onChange }: CategoryFieldProps) {
    const { t } = useTranslation()

    return (
        <>
            <Text className="text-ink text-xs font-medium leading-6 mb-1.5">
                {t("addTransaction.category")}
            </Text>
            <View>
                <PillGroup
                    options={categories.map((c) => ({
                        key: c.key,
                        label: c.label,
                        icon: c.icon,
                    }))}
                    value={value}
                    onChange={onChange}
                />
            </View>
            <View className="mb-3" />
        </>
    )
}