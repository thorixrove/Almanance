import { THEME_MODES, type ThemeMode } from "@/lib/theme";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity } from "react-native";
import { BottomSheet } from "./BottomSheet";

export function ThemePicker({
    visible,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean
    selected: ThemeMode
    onSelect: (mode: ThemeMode) => void
    onClose: () => void
}) {
    const { t } = useTranslation()

    return (
        <BottomSheet
            visible={visible}
            title={t("theme.pickerTitle")}
            onClose={onClose}
        >
            {THEME_MODES.map((item, index) => (
                <TouchableOpacity
                    key={item}
                    onPress={() => onSelect(item)}
                    className={`flex-row items-center py-3.5 ${
                        index < THEME_MODES.length - 1 ? "border-b border-line-soft" : ""
                    }`}
                >
                    <Text className="text-ink text-sm flex-1">{t(`theme.${item}`)}</Text>
                    {item === selected && (
                        <Feather name="check" size={16} color="#4A9EFF" />
                    )}
                </TouchableOpacity>
            ))}
        </BottomSheet>
    )
}