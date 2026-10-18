import { useThemeColors } from "@/components/ThemeProvider"
import { COLORS } from "@/constants/theme"
import {
    useCreateGoal,
    useDeleteGoal,
    useUpdateGoal,
} from "@/hooks/mutation/useGoalMutations"
import { formatDate } from "@/lib/i18n/dateLocale"
import { isGoalLimitError } from "@/lib/services/goals"
import { amountToInput, formatAmountInput, parseAmount } from "@/lib/utils"
import { parseDeadline, toDeadlineString } from "@/lib/utils/goals"
import type { Goal } from "@/types/goal"
import { Feather } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native"
import { BottomSheet } from "./BottomSheet"
import { CalendarPicker } from "./CalendarPicker"
import { boolean, emoji } from "zod"

const NAME_MAX_LENGTH = 40

const ICONS = [
    "🎯", "💻", "📱", "🏠", "🚗", "✈️", "🎓", "💍",
    "🛡️", "🏝️", "🎁", "📚", "🏥", "👶", "🎮", "💰",
]

// Harus berformat #RRGGBB (ada CHECK constraint di tabel goals)
const SWATCHES = [
    "#FF6B4A", "#FF3D71", "#F5A623", "#F7C948",
    "#0E9C79", "#2ECC71", "#1A85FF", "#1D6FAE",
    "#7B61FF", "#B455E8", "#8A8D96", "#5C5F68",
]

export function GoalSheet({
    visible,
    goal,
    onClose,
    onSaved,
    onDeleted,
}: {
    visible: boolean
    goal: Goal | null
    onClose: () => void
    onSaved: () => void
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const isEditing = !!goal

    const [name, setName] = useState("")
    const [target, setTarget] = useState("")
    const [deadline, setDeadline] = useState<Date | null>(null)
    const [datePickerOpen, setDatePickerOpen] = useState(false)
    const [icon, setIcon] = useState(ICONS[0])
    const [color, setColor] = useState(SWATCHES[4])
    const [error, setError] = useState("")

    const { mutateAsync: createGoal, isPending: creating } = useCreateGoal()
    const { mutateAsync: updateGoal, isPending: updating } = useUpdateGoal()
    const { mutateAsync: deleteGoal } = useDeleteGoal()
    const saving = creating || updating

    useEffect(() => {
        if (visible) {
            setName(goal?.name ?? "")
            setTarget(goal ? amountToInput(goal.target_amount) : "")
            setDeadline(goal?.deadline ? parseDeadline(goal.deadline) : null)
            setDatePickerOpen(false)
            setIcon(goal?.icon ?? ICONS[0])
            setColor(goal?.color ?? SWATCHES[4])
            setError("")
        }
    }, [visible, goal])

    const handleSave = async () => {
        const trimmed = name.trim()
        if (!trimmed) {
            setError("goal.nameRequired")
            return
        }

        const parsedTarget = parseAmount(target)
        if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
            setError("goal.targetInvalid")
            return
        }

        const deadlineStr = deadline ? toDeadlineString(deadline) : null

        if (
            deadlineStr &&
            deadlineStr !== (goal?.deadline ?? null) &&
            deadlineStr < toDeadlineString(new Date())
        ) {
            setError("goal.deadlinePast")
            return
        }

        setError("")
        const payload = {
            name: trimmed,
            icon,
            color,
            target_amount: parsedTarget,
            deadline: deadlineStr,
        }

        try {
            if (goal) {
                await updateGoal({ id: goal.id, payload })
            } else {
                await createGoal(payload)
            }
            onSaved()
        } catch (error) {
            if (isGoalLimitError(error)) setError("goal.limitReached")
            else setError("addTransaction.saveFailed")

        }
    }

    const handleDelete = () => {
        if (!goal) return

        Alert.alert(
            t("goal.delete"),
            t("goal.deleteConfirm", { name: goal.name }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("goal.delete"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteGoal(goal.id)
                            onDeleted()
                        } catch (error) {
                            Alert.alert(t("common.error"), t("goal.deleteFailed"))
                        }
                    },
                },
            ]
        )
    }

    const footer = (
        <>
            {error ? (
                <Text className="text-brand-coral text-xs mb-3">{t(error)}</Text>
            ) : null}


            <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-solid rounded-xl py-4 items-center"
                activeOpacity={0.85}
            >
                <Text className="text-on-solid text-sm font-semibold">
                    {saving
                        ? t("common.saving")
                        : isEditing
                            ? t("goal.saveChanges")
                            : t("goal.add")
                    }
                </Text>
            </TouchableOpacity>
        </>
    )


    return (

        <BottomSheet
            visible={visible}
            title={isEditing ? t("goal.editTitle") : t("goal.addTitle")}
            onClose={onClose}
            footer={footer}
        >
            <View className="items-center mb-5">
                <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${color}22` }}
                >
                    <Text className="text-2xl">{icon}</Text>
                </View>
            </View>


            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("goal.name")}
            </Text>
            <TextInput
                value={name}
                onChangeText={(v) => {
                    setError("")
                    setName(v)
                }}
                maxLength={NAME_MAX_LENGTH}
                placeholder={t("goal.namePlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
            />

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("goal.targetAmount")}
            </Text>
            <TextInput
                value={target}
                onChangeText={(v) => {
                    setError("")
                    setTarget(formatAmountInput(v))
                }}
                placeholder="0"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric"
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
            />

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("goal.deadline")}
            </Text>
            <View className="flex-row items-center gap-2 mb-1.5">
                <TouchableOpacity
                    onPress={() => setDatePickerOpen((v) => !v)}
                    className="flex-1 flex-row items-center justify-between bg-card border border-line rounded-xl px-4 py-3.5"
                >
                    <Text className={`text-sm ${deadline ? "text-ink" : "text-subtle"}`}>
                        {deadline
                            ? formatDate(deadline, "d MMMM yyyy")
                            : t("goal.noDeadline")}
                    </Text>
                    <Feather name="calendar" size={16} color={colors.icon} />
                </TouchableOpacity>
                {deadline && (
                    <TouchableOpacity
                        onPress={() => {
                            setError("")
                            setDeadline(null)
                            setDatePickerOpen(false)
                        }}
                        hitSlop={8}
                        className="w-11 h-11 rounded-xl bg-card border border-line items-center justify-center"
                    >
                        <Feather name="x" size={16} color={colors.icon} />
                    </TouchableOpacity>
                )}
            </View>
            {datePickerOpen && (
                <View className="bg-card border border-line rounded-xl mb-1.5 overflow-hidden">
                    <CalendarPicker
                        value={deadline ?? new Date()}
                        onChange={(selected) => {
                            setError("")
                            setDeadline(selected)
                            setDatePickerOpen(false)
                        }}
                    />
                </View>
            )}

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("goal.icon")}
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
                {t("goal.color")}
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
                            shadowColor: colors.ink,
                            shadowOpacity: color === swatch ? 0.6 : 0,
                            shadowRadius: 0,
                            shadowOffset: { width: 0, height: 0 },
                            elevation: color === swatch ? 3 : 0,
                        }}
                    />
                ))}
            </View>

            {isEditing && (
                <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
                    <Text className="text-brand-coral text-sm font-medium">
                        {t("goal.delete")}
                    </Text>
                </TouchableOpacity>
            )}
        </BottomSheet>
    )
}
