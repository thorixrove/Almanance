import { LANGUAGES, type LanguagePreference } from "@/lib/i18n";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity } from "react-native";
import { BottomSheet } from "./BottomSheet";

export function LanguagePicker({
    visible,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean
    selected: LanguagePreference
    onSelect: (language: LanguagePreference) => void
    onClose: () => void
}) {
    const { t } = useTranslation()
    const languages: { code: LanguagePreference; label: string }[] = [
        { code: "system", label: t("language.system") },
        ...LANGUAGES,
    ]

    return (
        <BottomSheet
            visible={visible}
            title={t("language.pickerTitle")}
            onClose={onClose}
        >
            {languages.map((item, index) => (
                <TouchableOpacity
                    key={item.code}
                    onPress={() => onSelect(item.code)}
                    className={`flex-row items-center py-3.5 ${
                        index < languages.length - 1 ? "border-b border-line-soft" : ""
                    }`}
                >
                    <Text className="text-ink text-sm flex-1">{item.label}</Text>
                    {item.code === selected && (
                        <Feather name="check" size={16} color="#4A9EFF" />
                    )}
                </TouchableOpacity>
            ))}
        </BottomSheet>
    )
}