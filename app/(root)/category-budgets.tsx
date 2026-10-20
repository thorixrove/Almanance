import { CategoryBudgetSheet } from "@/components/CategoryBudgetSheet";
import { useThemeColors } from "@/components/ThemeProvider";
import { useCategoryBudgetsQuery } from "@/hooks/queries/useCategoryBudgetsQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/lib/utils";
import {
    buildCategoryBudgetUsages,
    type CategoryBudgetUsage,
} from "@/lib/utils/categoryBudgets";
import { useUserStore } from "@/store/useStore";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WARNING_COLOR = "#F5A623";
const OVER_COLOR = "#FF6B4A";

function barColor(usage: CategoryBudgetUsage, categoryColor: string) {
    if (usage.status === "over") return OVER_COLOR
    if (usage.status === "warning") return WARNING_COLOR
    return categoryColor
}

function BudgetCard({
    usage,
    onPress
}: {
    usage: CategoryBudgetUsage
    onPress: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const currency = useUserStore((s) => s.currency)
    const { getCategory } = useCategories()

    const info = getCategory(usage.budget.category, "EXPENSE")
    const over = usage.status === "over"

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-card rounded-2xl border border-line p-4 mb-3"
        >
            <View className="flex-row items-center mb-3">
                <View className="w-11 h-11 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${info.color}22` }}
                >
                    <Text>{info.icon}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                        {info.label}
                    </Text>
                    <Text className="text-brand-text-secondary text-[11px] mt-0.5">
                        {t("categoryBudget.usedOf", {
                            spent: formatPrice(usage.spent, currency),
                            limit: formatPrice(Number(usage.budget.amount), currency)
                        })}
                    </Text>
                </View>
                <Feather name="edit-2" size={15} color={colors.subtle} />
            </View>

            <View className="h-2 rounded-full bg-line-soft overflow-hidden">
                <View
                    className="h-2 rounded-full"
                    style={{
                        width: `${usage.barPercent}%`,
                        backgroundColor: barColor(usage, info.color),
                    }}
                />
            </View>

            <View className="flex-row items-center justify-between mt-2">
                <Text className="text-ink text-xs font-medium">
                    {Math.floor(usage.percent)}
                </Text>
                <Text className={`text-[11px] ${over ? "text-brand-coral" : "text-brand-text-secondary"}`}>
                    {over ? t("categoryBudget.exceeded", {
                        amount: formatPrice(Math.abs(usage.remaining), currency)
                    })
                        : t("categoryBudget.remaining", {
                            amount: formatPrice(usage.remaining, currency)
                        })
                    }
                </Text>
            </View>
        </TouchableOpacity>
    )
}

export default function CategoryBudgetsScreen() {
    const router = useRouter()
    const { t, i18n } = useTranslation()
    const colors = useThemeColors()
    const currency = useUserStore((s) => s.currency)

    const budgetQuery = useCategoryBudgetsQuery()
    const transactionsQuery = useTransactionsQuery()


    const { refetch: refetchBudgets } = budgetQuery
    const { refetch: refetchTransactions } = transactionsQuery

    useFocusEffect(
        useCallback(() => {
            refetchBudgets()
            refetchTransactions()
        }, [refetchBudgets, refetchTransactions])
    )

    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingId, setEditingId] = useState<String | null>(null)

    const budgets = budgetQuery.data
    const transactions = transactionsQuery.data

    const usages = useMemo(
        () => buildCategoryBudgetUsages(budgets ?? [], transactions ?? []),
        [budgets, transactions]
    )

    const editing = (budgets ?? []).find((b) => b.id === editingId) ?? null

    const totals = useMemo(() => {
        let spent = 0
        let limit = 0
        for (const u of usages) {
            spent += u.spent
            limit += Number(u.budget.amount)
        }
        const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
        return { spent, limit, percent, over: spent > limit }
    }, [usages])

    const monthLabel = new Date().toLocaleDateString(i18n.language, {
        month: "long",
        year: "numeric",
    })

    const isLoading = budgetQuery.isLoading || transactionsQuery.isLoading
    const isError = budgetQuery.isError || transactionsQuery.isError

    const retry = () => {
        if (budgetQuery.isError) refetchBudgets()
        if (transactionsQuery.isError) refetchTransactions()
    }

    const openCreate = () => {
        setEditingId(null)
        setSheetOpen(true)
    }

    const openEdit = (id: string) => {
        setEditingId(id)
        setSheetOpen(true)
    }

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
                    {t("categoryBudget.title")}
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
                        onPress={retry}
                        activeOpacity={0.7}
                        className="bg-card rounded-2xl border border-line px-4 py-5 items-center mt-2"
                    >
                        <Feather name="refresh-cw" size={16} color={colors.icon} />
                        <Text className="text-brand-coral text-xs text-center mt-2">
                            {t("categoryBudget.loadFailedScreen")}
                        </Text>
                    </TouchableOpacity>
                ) : usages.length === 0 ? (
                    <View className="bg-card rounded-2xl border border-line px-4 py-5 mt-2 items-center">
                        <Text className="text-subtle text-xs text-center mb-4">
                            {t("categoryBudget.empty")}
                        </Text>
                        <TouchableOpacity
                            onPress={openCreate}
                            className="bg-solid rounded-xl px-5 py-3"
                            activeOpacity={0.85}
                        >
                            <Text className="text-on-solid text-sm font-semibold">
                                {t("categoryBudget.createFirst")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View className="bg-card rounded-[18px] border border-line p-4 mb-4">
                            <Text className="text-subtle text-[11px] uppercase tracking-wide mb-1">
                                {t("categoryBudget.thisMonth", { month: monthLabel })}
                            </Text>
                            <Text className="text-ink text-sm font-medium mb-3">
                                {t("categoryBudget.usedOf", {
                                    spent: formatPrice(totals.spent, currency),
                                    limit: formatPrice(totals.limit, currency),
                                })}
                            </Text>
                            <View className="h-1.5 rounded-full bg-line-soft overflow-hidden">
                                <View
                                    className="h-1.5 rounded-full"
                                    style={{
                                        width: `${totals.percent}%`,
                                        backgroundColor: totals.over ? OVER_COLOR : colors.ink,
                                    }}
                                />
                            </View>
                        </View>

                        {usages.map((u) => (
                            <BudgetCard
                                key={u.budget.id}
                                usage={u}
                                onPress={() => openEdit(u.budget.id)}
                            />
                        ))}
                    </>
                )}
            </ScrollView>

            <CategoryBudgetSheet
                visible={sheetOpen}
                budget={editing}
                onClose={() => setSheetOpen(false)}
                onSaved={() => setSheetOpen(false)}
                onDeleted={() => setSheetOpen(false)}
            />
        </SafeAreaView>
    )
}
