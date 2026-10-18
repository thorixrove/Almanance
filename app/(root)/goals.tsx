import { GoalContributeSheet } from "@/components/GoalContributeSheet";
import { GoalSheet } from "@/components/GoalSheet";
import { useThemeColors } from "@/components/ThemeProvider";
import { useGoalsQuery } from "@/hooks/queries/useGoalsQuery";
import { formatPrice } from "@/lib/utils";
import { getGoalProgress } from "@/lib/utils/goals";
import { useUserStore } from "@/store/useStore";
import type { Goal } from "@/types/goal";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



function GoalCard({
    goal,
    onPress,
    onEdit,
}: {
    goal: Goal
    onPress: () => void
    onEdit: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const currency = useUserStore((s) => s.currency)
    const { percent, remaining, isComplete, daysLeft, monthlyNeeded } = getGoalProgress(goal)

    let deadlineText: string | null = null
    let deadlineLate = false
    if (!isComplete && daysLeft !== null) {
        if (daysLeft < 0) {
            deadlineText = t("goal.overdue")
            deadlineLate = true
        } else if (daysLeft === 0) {
            deadlineText = t("goal.dueToday")
        } else if (daysLeft === 1) {
            deadlineText = t("goal.daysLeftOne", { count: daysLeft })
        } else {
            deadlineText = t("goal.daysLeftMany", { count: daysLeft })
        }
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-card rounded-2xl border border-line p-4 mb-3"
        >
            <View className="flex-row items-center mb-3">
                <View
                    className="w-11 h-11 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${goal.color}22` }}
                >
                    <Text>{goal.icon}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                        {goal.name}
                    </Text>
                    <Text className="text-brand-text-secondary text-[11px] mt-0.5">
                        {t("goal.savedOf", {
                            saved: formatPrice(Number(goal.saved_amount), currency),
                            target: formatPrice(Number(goal.target_amount), currency),
                        })}
                    </Text>
                </View>
                <TouchableOpacity onPress={onEdit} hitSlop={10} className="pl-3 py-1">
                    <Feather name="edit-2" size={15} color={colors.subtle} />
                </TouchableOpacity>
            </View>


            <View className="h-2 rounded-full bg-line-soft overflow-hidden">
                <View
                    className="h-2 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: goal.color }}
                />
            </View>

            <View className="flex-row items-center justify-between mt-2">
                <Text className="text-ink text-xs font-medium">
                    {Math.floor(percent)}%
                </Text>
                <Text className="text-brand-text-secondary text-[11px]">
                    {isComplete
                        ? t("goal.reached")
                        : t("goal.remaining", { amount: formatPrice(remaining, currency) })
                    }
                </Text>
            </View>

            {(deadlineText || monthlyNeeded !== null) && (
                <View className="flex-row items-center justify-between mt-1.5">
                    {deadlineText ? (
                        <Text
                            className={`text-[11px] ${deadlineLate ? "text-brand-coral" : "text-subtle"
                                }`}
                        >
                            {deadlineText}
                        </Text>
                    ) : (
                        <View />
                    )}
                    {monthlyNeeded !== null && (
                        <Text className="text-subtle text-[11px]">
                            {t("goal.monthlyNeeded", {
                                amount: formatPrice(Math.ceil(monthlyNeeded), currency),
                            })}
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    )
}

export default function GoalsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const { data: goals = [], isLoading, isError, refetch } = useGoalsQuery();

    // Selalu ambil data terbaru setiap layar ini dibuka.
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [contributeId, setContributeId] = useState<string | null>(null);

    // Diturunkan dari data query supaya selalu terbaru setelah menabung/mengubah.
    const editing = goals.find((g) => g.id === editingId) ?? null;
    const contributing = goals.find((g) => g.id === contributeId) ?? null;

    const active = goals.filter((g) => !g.completed_at);
    const completed = goals.filter((g) => !!g.completed_at);

    const openCreate = () => {
        setEditingId(null);
        setSheetOpen(true);
    };

    const openEdit = (id: string) => {
        setEditingId(id);
        setSheetOpen(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-page" edges={["top", "bottom"]}>
            {/* Header */}
            <View className="flex-row items-center px-5 pt-3 pb-3 gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={8}
                    className="w-10 h-10 rounded-full bg-card border border-line items-center justify-center"
                >
                    <Feather name="arrow-left" size={18} color={colors.ink} />
                </TouchableOpacity>
                <Text className="flex-1 text-ink text-lg font-medium">
                    {t("goal.title")}
                </Text>
                <TouchableOpacity
                    onPress={openCreate}
                    hitSlop={8}
                    className="w-10 h-10 rounded-full bg-solid items-center justify-center"
                >
                    <Feather name="plus" size={18} color={colors.card} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            >
                {isLoading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator color={colors.icon} />
                    </View>
                ) : isError ? (
                    <TouchableOpacity
                        onPress={() => refetch()}
                        activeOpacity={0.7}
                        className="bg-card rounded-2xl border border-line px-4 py-5 items-center mt-2"
                    >
                        <Feather name="refresh-cw" size={16} color={colors.icon} />
                        <Text className="text-brand-coral text-xs text-center mt-2">
                            {t("goal.loadFailed")}
                        </Text>
                    </TouchableOpacity>
                ) : goals.length === 0 ? (
                    <View className="bg-card rounded-2xl border border-line px-4 py-5 mt-2">
                        <Text className="text-subtle text-xs text-center">
                            {t("goal.empty")}
                        </Text>
                    </View>
                ) : (
                    <>
                        {active.length > 0 && (
                            <>
                                <Text className="text-subtle text-[11px] uppercase tracking-wide mb-2 mt-2">
                                    {t("goal.active")}
                                </Text>
                                {active.map((g) => (
                                    <GoalCard
                                        key={g.id}
                                        goal={g}
                                        onPress={() => setContributeId(g.id)}
                                        onEdit={() => openEdit(g.id)}
                                    />
                                ))}
                            </>
                        )}

                        {completed.length > 0 && (
                            <>
                                <Text className="text-subtle text-[11px] uppercase tracking-wide mb-2 mt-4">
                                    {t("goal.completed")}
                                </Text>
                                {completed.map((g) => (
                                    <GoalCard
                                        key={g.id}
                                        goal={g}
                                        onPress={() => setContributeId(g.id)}
                                        onEdit={() => openEdit(g.id)}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}
            </ScrollView>

            <GoalSheet
                visible={sheetOpen}
                goal={editing}
                onClose={() => setSheetOpen(false)}
                onSaved={() => setSheetOpen(false)}
                onDeleted={() => setSheetOpen(false)}
            />

            <GoalContributeSheet
                visible={!!contributing}
                goal={contributing}
                onClose={() => setContributeId(null)}
                onSaved={() => setContributeId(null)}
            />
        </SafeAreaView>
    );
}