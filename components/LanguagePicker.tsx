import { LANGUAGES, type Language } from "@/lib/i18n";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LanguagePicker({
    visible,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean
    selected: Language
    onSelect: (language: Language) => void
    onClose: () => void
}) {
    const { t } = useTranslation()

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
                <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
                    <Text className="text-brand-bg text-base font-semibold">
                        {t("language.pickerTitle")}
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-brand-text-secondary text-sm">
                            {t("common.cancel")}
                        </Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={LANGUAGES}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => onSelect(item.code)}
                            className="flex-row items-center px-5 py-3.5 border-b border-[#F0EDE6]"
                        >
                            <Text className="text-brand-bg text-sm flex-1">(item.label)</Text>
                            {item.code === selected && (
                                <Feather name="check" size={16} color="#4A9EFF" />
                            )}
                        </TouchableOpacity>
                    )}

                />
            </SafeAreaView>
        </Modal>
    )
}