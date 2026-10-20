import { useCategoryBudgetsQuery } from "@/hooks/queries/useCategoryBudgetsQuery"
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import { useCategories } from "@/hooks/useCategories"
import { formatPrice } from "@/lib/utils"
import {
    buildCategoryBudgetUsages,
    summarizeCategoryBudgets,
} from "@/lib/utils/categoryBudgets"
import { useUserStore } from "@/store/useStore"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity, View } from "react-native"

const WARNING_COLOR = "#F5A623"
const OVER_COLOR = "#FF6B4A"


export function HomeCategoryBudgetsCard() {
    const { t } = useTranslation()
    const router = useRouter()
    const currency = useUserStore((s) => s.currency)
    const { getCategory } = useCategories()

    const budgetQuery = useCategoryBudgetsQuery()
    const transactionQuery = useTransactionsQuery()
    const budgets = budgetQuery.data
    const transactions = transactionQuery.data

    const usages = useMemo(
        () => buildCategoryBudgetUsages(budgets ?? [], transactions ?? []),
        [budgets, transactions]
    )
    const summary = useMemo(() => summarizeCategoryBudgets(usages), [usages])

    if (
        budgetQuery.isLoading ||
        transactionQuery.isLoading ||
        budgetQuery.isError ||
        transactionQuery.isError ||
        !budgets ||
        !transactions
    ) {
        return null
    }

    const openBudgets = () => router.push("/(root)/category-budgets")
    const cardClass = "bg-card rounded-[18px] border border-line p-4 mb-[18px] flex-row items-center gap-3"

    if (usages.length === 0) {
        return (
            <TouchableOpacity onPress={openBudgets} activeOpacity={0.85} className={cardClass}>
                <View className="w-9 h-9 rounded-full bg-[#F5A6231A] items-center justify-center">
                    <Feather name="pie-chart" size={16} color={WARNING_COLOR} />
                </View>
                <View className="flex-1">
                    <Text className="text-ink text-sm font-medium">
                        {t("categoryBudget.title")}
                    </Text>
                    <Text className="text-brand-text-secondary text-xs mt-0.5">
                        {t("categoryBudget.homeEmpty")}
                    </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#8A8D96" />
            </TouchableOpacity>
        )
    }

    const top = usages[0]

    if (top.status === "safe") {
        return (
            <TouchableOpacity onPress={openBudgets} activeOpacity={0.85} className={cardClass}>
                <View className="w-9 h-9 rounded-full bg-[#F5A6231A] items-center justify-center">
                    <Feather name="pie-chart" size={16} color={WARNING_COLOR} />
                </View>
                <View className="flex-1">
                    <Text className="text-ink text-sm font-medium">
                        {t("categoryBudget.title")}
                    </Text>
                    <Text className="text-brand-text-secondary text-xs mt-0.5">
                        {t("categoryBudget.homeAllSafe", { count: summary.total })}
                    </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#8A8D96" />
            </TouchableOpacity>
        )
    }

    const info = getCategory(top.budget.category, "EXPENSE")
    const color = top.status === "over" ? OVER_COLOR : WARNING_COLOR
    const othersOver = summary.over - (top.status === "over" ? 1 : 0)
    const otherWarning = summary.warning - (top.status === "warning" ? 1 : 0)

    let moreText: string | null = null
    if (othersOver > 0) moreText = t("categoryBudget.homeMoreOver", { count: othersOver })
    else if (otherWarning > 0)
        moreText = t("categoryBudget.homeMoreWarning", { count: otherWarning })

    return (
        <TouchableOpacity onPress={openBudgets} activeOpacity={0.85} className={cardClass}>
            <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: `${info.color}22` }}
            >
                <Text className="text-base">{info.icon}</Text>
            </View>

            <View className="flex-1">
                <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-ink text-sm font-medium" numberOfLines={1}>
                        {info.label}
                    </Text>
                    <Text className="text-ink text-xs font-medium ml-2">
                        {Math.floor(top.percent)}
                    </Text>
                </View>

                <View className="h-1.5 rounded-full bg-line-soft overflow-hidden my-1.5">
                    <View
                        className="h-1.5 rounded-full"
                        style={{ width: `${top.barPercent}%`, backgroundColor: color }}
                    />
                </View>

                <View className="flex-row items-center justify-between">
                    <Text
                        className={`flex-1 text-[11px] ${top.status === "over" ? "text-brand-coral" : "text-brand-text-secondary"
                            }`}
                        numberOfLines={1}
                    >
                        {top.status === "over"
                            ? t("categoryBudget.exceeded", {
                                amount: formatPrice(Math.abs(top.remaining), currency),
                            })
                            : t("categoryBudget.remaining", {
                                amount: formatPrice(top.remaining, currency)
                            })}
                    </Text>
                    {moreText && (
                        <Text className="text-subtle text-[11px] ml-2">{moreText}</Text>
                    )}
                </View>
            </View>
            <Feather name="chevron-right" size={16} color="#8A8D96" />
        </TouchableOpacity>
    )
}