import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

export function ScanningOverlay() {
    const { t } = useTranslation()

    return (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
            <View className="bg-card rounded-2xl px-6 py-5 items-center">
                <ActivityIndicator color="#4A9EFF" />
                <Text className="text-ink text-sm mt-3">{t("addTransaction.readingReceipt")}</Text>
            </View>
        </View>
    )
}