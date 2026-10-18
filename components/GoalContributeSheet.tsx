import { COLORS } from "@/constants/theme"
import { useContributeToGoal } from "@/hooks/mutation/useGoalMutations"
import { isGoalInsufficientError } from "@/lib/services/goals"
import {
    amountToInput,
    formatAmountInput,
    formatPrice,
    parseAmount,
} from "@/lib/utils"
import { getGoalProgress } from "@/lib/utils/goals"
import { useUserStore } from "@/store/useStore"
import type { Goal } from "@/types/goal"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, TextInput, TouchableOpacity, View } from "react-native"
import { BottomSheet } from "./BottomSheet"

type Mode = "ADD" | "WITHDRAW"
const MODES: Mode[] = ["ADD", "WITHDRAW"]



export function GoalContributeSheet({
    visible,
    goal,
    onClose,
    onSaved,
}: {
    visible: boolean
    goal: Goal | null
    onClose: () => void
    onSaved: () => void
}) {
    const { t } = useTranslation()
    const currency = useUserStore((s) => s.currency)
    const { mutateAsync: contribute, isPending: saving } = useContributeToGoal()

    const [mode, setMode] = useState<Mode>("ADD")
    const [amount, setAmount] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        if (visible) {
            setMode("ADD")
            setAmount("")
            setError("")
        }
    }, [visible, goal?.id])

    const progress = goal ? getGoalProgress(goal) : null
    const saved = goal ? Number(goal.saved_amount) : 0

    const handleSave = async () => {
        if (!goal) return

        const parsed = parseAmount(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setError("goal.amountInvalid")
            return
        }
        if (mode === "WITHDRAW" && parsed > saved) {
            setError("goal.insufficient")
            return
        }

        setError("")
        try {
            await contribute({
                id: goal.id,
                amount: mode === "ADD" ? parsed : -parsed,
            })
            onSaved()
        } catch (error) {
            if (isGoalInsufficientError(error)) setError("goal.insufficient")
            else setError("goal.contributeFailed")
        }
    }

    const fillValue = mode === "ADD" ? progress?.remaining ?? 0 : saved

    const footer = (
        <>
            {error ? (
                <Text className="text-brand-coral text-xs mb-3">{t(error)}</Text>
            ) : null}

            <TouchableOpacity
                onPress={handleSave}
                disabled={saving || !goal}
                className="bg-solid rounded-xl py-4 items-center"
                activeOpacity={0.85}
            >
                <Text className="text-on-solid text-sm font-semibold">
                    {saving
                        ? t("common.saving")
                        : mode === "ADD"
                            ? t("goal.depositAction")
                            : t("goal.withdrawAction")
                    }
                </Text>
            </TouchableOpacity>
        </>
    )

    return (
        <BottomSheet
            visible={visible}
            title={t("goal.contributeTitle")}
            onClose={onClose}
            footer={footer}
        >
            {goal && progress && (
                <View className="flex-row items-center mb-5">
                    <View
                        className="w-11 h-11 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${goal.color}22` }}
                    >
                        <Text className="text-xl">{goal.icon}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                            {goal.name}
                        </Text>
                        <Text className="text-brand-text-secondary text-[11px] mt-0.5">
                            {t("goal.savedOf", {
                                saved: formatPrice(saved, currency),
                                target: formatPrice(Number(goal.target_amount), currency)
                            })}
                        </Text>
                    </View>
                </View>
            )}

            <View className="flex-row bg-card rounded-xl border border-line p-1 mb-4">
                {MODES.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        onPress={() => {
                            setMode(opt)
                            setError("")
                        }}
                        className={`flex-1 py-2 rounded-lg items-center ${mode === opt ? "bg-solid" : ""
                            }`}
                    >
                        <Text
                            className={`text-xs font-medium ${mode === opt ? "text-on-solid" : "text-brand-text-secondary"
                                }`}
                        >
                            {t(opt === "ADD" ? "goal.deposit" : "goal.withdraw")}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>


            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("addTransaction.amount")}
            </Text>
            <TextInput
                value={amount}
                onChangeText={(v) => {
                    setError("")
                    setAmount(formatAmountInput(v))
                }}
                placeholder="0"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric"
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-2"
            />

            {fillValue > 0 && (
                <TouchableOpacity
                    onPress={() => {
                        setError("")
                        setAmount(amountToInput(fillValue))
                    }}
                    className="self-start mb-4"
                    hitSlop={8}

                >
                    <Text className="text-xs font-medium text-ink">
                        {mode === "ADD"
                            ? t("goal.fillRemaining", {
                                amount: formatPrice(fillValue, currency),
                            })
                            : t("goal.fillAll", {
                                amount: formatPrice(fillValue, currency)
                            })
                        }
                    </Text>
                </TouchableOpacity>
            )}
        </BottomSheet>
    )
}