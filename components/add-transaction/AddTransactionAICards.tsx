import { AIActionCard } from "@/components/AIActionCard";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type AddTransactionAICardsProps = {
    onScan: () => void
    onVoice: () => void
}

export function AddTransactionAICards({ onScan, onVoice }: AddTransactionAICardsProps) {
    const { t } = useTranslation()

    return (
        <View className="flex-row gap-2.5 mb-4">
            <AIActionCard
                icon="camera"
                title={t("addTransaction.scanTitle")}
                subtitle={t("addTransaction.scanSubtitle")}
                colors={AI_GRADIENT}
                onPress={onScan}
            />
            <AIActionCard
                icon="mic"
                title={t("addTransaction.voiceTitle")}
                subtitle={t("addTransaction.voiceSubtitle")}
                colors={AI_GRADIENT_REVERSE}
                onPress={onVoice}
            />
        </View>
    )
}