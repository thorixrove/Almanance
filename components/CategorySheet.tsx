import { useThemeColors } from "@/components/ThemeProvider";
import { COLORS } from "@/constants/theme";
import {
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "@/hooks/mutation/useCategoryMutations";
import { useCategories } from "@/hooks/useCategories";
import { useSupabase } from "@/hooks/useSupabase";
import {
    getCategoryUsageCount,
    isCategoryLimitError,
    isDuplicateCategoryError,
} from "@/lib/services/categories";
import type { CustomCategory, CustomCategoryType } from "@/types/category";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheet } from "./BottomSheet";

const NAME_MAX_LENGTH = 30;

const ICONS = [
    "🛒", "🍔", "☕", "🚗", "🏠", "💡", "📱", "🎮",
    "🎬", "✈️", "🏥", "💊", "📚", "🎓", "🎁", "🐶",
    "👶", "👕", "💄", "🔧", "💼", "📈", "💰", "🏷️",
];

// Harus berformat #RRGGBB (ada CHECK constraint di tabel custom_categories)
const SWATCHES = [
    "#FF6B4A", "#FF3D71", "#F5A623", "#F7C948",
    "#0E9C79", "#2ECC71", "#1A85FF", "#1D6FAE",
    "#7B61FF", "#B455E8", "#8A8D96", "#5C5F68",
];

const TYPES: CustomCategoryType[] = ["EXPENSE", "INCOME"];


export function CategorySheet({
    visible,
    category,
    defaultType,
    onClose,
    onSaved,
    onDeleted,
}: {
    visible: boolean
    category: CustomCategory | null
    defaultType: CustomCategoryType
    onClose: () => void
    onSaved: () => void
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const supabase = useSupabase()
    const { expense, income, getCategory } = useCategories()
    const isEditing = !!category

    const [name, setName] = useState("")
    const [icon, setIcon] = useState(ICONS[0])
    const [color, setColor] = useState(SWATCHES[0])
    const [type, setType] = useState<CustomCategoryType>("EXPENSE")
    const [error, setError] = useState("")

    const { mutateAsync: createCategory, isPending: creating } = useCreateCategory()
    const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory()
    const { mutateAsync: deleteCategory } = useDeleteCategory()
    const saving = creating || updating

    useEffect(() => {
        if (visible) {
            setName(category?.name ?? "")
            setIcon(category?.icon ?? ICONS[0])
            setColor(category?.color ?? SWATCHES[0])
            setType(category?.type ?? defaultType)
            setError("")
        }
    }, [visible, category, defaultType])

    const handleSave = async () => {
        const trimmed = name.trim()
        if (!trimmed) {
            setError("customCategory.nameRequired")
            return
        }

        const lower = trimmed.toLowerCase()
        const taken = (type === "INCOME" ? income : expense).some(
            (c) =>
                c.key !== category?.key &&
                (c.label.trim().toLowerCase() === lower ||
                    c.englishLabel.trim().toLowerCase() === lower)
        )
        if (taken) {
            setError("customCategory.nameTaken")
            return
        }

        setError("")
        try {
            if (category) {
                await updateCategory({
                    id: category.id,
                    payload: { name: trimmed, icon, color }
                })
            } else {
                await createCategory({ name: trimmed, icon, color, type })
            }
            onSaved()
        } catch (e) {
            if (isDuplicateCategoryError(e)) setError("customCategory.nameTaken")
            else if (isCategoryLimitError(e)) setError("customCategory.limitReached")
            else setError("addTransaction.saveFailed")
        }
    }

    const handleDelete = async () => {
        if (!category) return

        let count = 0
        try {
            count = await getCategoryUsageCount(supabase, category.key)
        } catch {
            Alert.alert(t("common.error"), t("customCategory.checkFailed"))
            return
        }

        const target = getCategory(
            category.type === "INCOME" ? "other_income" : "other"
        ).label
        const message =
            count === 0
                ? t("customCategory.deleteConfirm", { name: category.name })
                : count === 1
                    ? t("customCategory.deleteMessageOne", { count, target })
                    : t("customCategory.deleteMessageMany", { count, target })

        Alert.alert(t("customCategory.delete"), message, [
            { text: t("common.cancel"), style: "cancel" },
            {
                text: t("customCategory.delete"),
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteCategory(category.id)
                        onDeleted()
                    } catch {
                        Alert.alert(t("common.error"), t("customCategory.deleteFailed"))
                    }
                },
            },
        ])
    }


    return (
        <BottomSheet
            visible={visible}
            title={
                isEditing ? t("customCategory.editTitle") : t("customCategory.addTitle")
            }
            onClose={onClose}
        >
            {/* Pratinjau */}
            <View className="items-center mb-5">
                <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${color}22` }}
                >
                    <Text className="text-2xl">{icon}</Text>
                </View>
            </View>


            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("customCategory.name")}
            </Text>
            <TextInput
                value={name}
                onChangeText={setName}
                maxLength={NAME_MAX_LENGTH}
                placeholder={t("customCategory.namePlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
            />
            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("customCategory.type")}
            </Text>
            <View
                className="flex-row bg-card rounded-xl border border-line p-1 mb-1.5"
                style={{ opacity: isEditing ? 0.6 : 1 }}
            >
                {TYPES.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        disabled={isEditing}
                        onPress={() => setType(opt)}
                        className={`flex-1 py-2 rounded-lg items-center ${type === opt ? "bg-solid" : ""
                            }`}
                    >
                        <Text
                            className={`text-xs font-medium ${type === opt ? "text-on-solid" : "text-brand-text-secondary"
                                }`}
                        >
                            {t(`customCategory.${opt === "INCOME" ? "income" : "expense"}`)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {isEditing ? (
                <Text className="text-subtle text-[11px] mb-5">
                    {t("customCategory.typeLocked")}
                </Text>
            ) : (
                <View className="mb-3.5" />
            )}

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("customCategory.icon")}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
                {ICONS.map((emoji) => (
                    <TouchableOpacity
                        key={emoji}
                        onPress={() => setIcon(emoji)}
                        className="w-11 h-11 rounded-xl items-center justify-center bg-card border"
                        style={{
                            borderColor: icon === emoji ? colors.ink : colors.line,
                            borderWidth: icon === emoji ? 1.5 : 1,
                        }}
                    >
                        <Text className="text-xl">{emoji}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("customCategory.color")}
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-5">
                {SWATCHES.map((swatch) => (
                    <TouchableOpacity
                        key={swatch}
                        onPress={() => setColor(swatch)}
                        className="w-9 h-9 rounded-full items-center justify-center"
                        style={{
                            backgroundColor: swatch,
                            borderWidth: color === swatch ? 3 : 0,
                            borderColor: colors.card,
                            // cincin tipis di luar agar swatch terpilih terlihat di tema gelap/terang
                            shadowColor: colors.ink,
                            shadowOpacity: color === swatch ? 0.6 : 0,
                            shadowRadius: 0,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: color === swatch ? 3 : 0,
                        }}
                    />
                ))}
            </View>

            {error ? (
                <Text className="text-brand-coral text-xs mb-3">{t(error)}</Text>
            ) : null}

            <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-solid rounded-xl py-4 items-center mb-3"
                activeOpacity={0.85}
            >
                <Text className="text-on-solid text-sm font-semibold">
                    {saving
                        ? t("common.saving")
                        : isEditing
                            ? t("customCategory.saveChanges")
                            : t("customCategory.add")}
                </Text>
            </TouchableOpacity>

            {isEditing && (
                <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
                    <Text className="text-brand-coral text-sm font-medium">
                        {t("customCategory.delete")}
                    </Text>
                </TouchableOpacity>
            )}
        </BottomSheet>
    )
}