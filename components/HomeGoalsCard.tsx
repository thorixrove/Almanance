import { useGoalsQuery } from "@/hooks/queries/useGoalsQuery"
import { formatPrice } from "@/lib/utils"
import { getGoalProgress } from "@/lib/utils/goals"
import { useUserStore } from "@/store/useStore"
import type { Goal } from "@/types/goal"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"

// Tenggat terdekat dulu, target tanpa tenggat di bawah, lalu urut dibuat.
function sortActive(a: Goal, b: Goal) {
    if (a.deadline && b.deadline) {
        if (a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1
    } else if (a.deadline) {
        return -1
    } else if (b.deadline) {
        return 1
    }
    return a.created_at < b.created_at ? -1 : 1
}

export function HomeGoalsCard() {
    const { t } = useTranslation()
    const router = useRouter()
    const currency = useUserStore((s) => s.currency)
    const { data: goals, isLoading, isError } = useGoalsQuery()

    const active = useMemo(
        () => (goals ?? []).filter((g) => !g.completed_at).sort(sortActive),
        [goals]
    )

    // Loading/error: kartu tidak tampil supaya Home tidak terganggu.
    if (isLoading || isError || !goals) return null

    const openGoals = () => router.push("/(root)/goals")

    if (goals.length === 0) {
        return (
            <TouchableOpacity
                onPress={openGoals}
                activeOpacity={0.85}
                className="bg-card rounded-[18px] border border-line p-4 mb-[18px] flex-row items-center gap-3"
            >
                <View className="w-9 h-9 rounded-full bg-[#4A9EFF1A] items-center justify-center">
                    <Feather name="target" size={16} color="#4A9EFF" />
                </View>
                <View className="flex-1">
                    <Text className="text-ink text-sm font-medium">{t("goal.title")}</Text>
                    <Text className="text-brand-text-secondary text-xs mt-0.5">
                        {t("goal.homeEmpty")}
                    </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#8A8D96" />
            </TouchableOpacity>
        )
    }

    // Semua target sudah tercapai: kartu disembunyikan.
    if (active.length === 0) return null

    // Satu target saja (tenggat terdekat); sisanya dilihat di layar Goals.
    const goal = active[0]
    const others = active.length - 1
    const { percent, remaining } = getGoalProgress(goal)

    return (
        <TouchableOpacity
            onPress={openGoals}
            activeOpacity={0.85}
            className="bg-card rounded-[18px] border border-line p-4 mb-[18px] flex-row items-center gap-3"
        >
            <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: `${goal.color}22` }}
            >
                <Text className="text-base">{goal.icon}</Text>
            </View>

            <View className="flex-1">
                <View className="flex-row items-center justify-between">
                    <Text
                        className="flex-1 text-ink text-sm font-medium"
                        numberOfLines={1}
                    >
                        {goal.name}
                    </Text>
                    <Text className="text-ink text-xs font-medium ml-2">
                        {Math.floor(percent)}%
                    </Text>
                </View>

                <View className="h-1.5 rounded-full bg-line-soft overflow-hidden my-1.5">
                    <View
                        className="h-1.5 rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: goal.color }}
                    />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text
                        className="flex-1 text-brand-text-secondary text-[11px]"
                        numberOfLines={1}
                    >
                        {t("goal.remaining", { amount: formatPrice(remaining, currency) })}
                    </Text>
                    {others > 0 && (
                        <Text className="text-subtle text-[11px] ml-2">
                            {t("goal.moreGoals", { count: others })}
                        </Text>
                    )}
                </View>
            </View>

            <Feather name="chevron-right" size={16} color="#8A8D96" />
        </TouchableOpacity>
    )
}