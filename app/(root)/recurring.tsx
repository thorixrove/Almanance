import { RecurringSheet } from "@/components/recurring/RecurringSheet"
import { useThemeColors } from "@/components/ThemeProvider"
import { useProcessRecurringRules } from "@/hooks/mutation/useRecurringMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { useRecurringQuery } from "@/hooks/queries/useRecurringQuery"
import { useCategories } from "@/hooks/useCategories"
import { formatDate } from "@/lib/i18n/dateLocale"
import { formatPrice } from "@/lib/utils"
import { parseDeadline } from "@/lib/utils/goals"
import {
    getNextRunLabel,
    getRecurringStatus,
    getScheduleLabel,
    sortRecurringRules,
    summarizeRecurring,
} from "@/lib/utils/recurring"
import { useUserStore } from "@/store/useStore"
import type { RecurringRule } from "@/types/recurring"
import { Feather } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const INCOME_COLOR = "#0E9C79"
const EXPENSE_COLOR = "#FF6B4A"

function RuleCard({
    rule,
    accountName,
    onPress,
}: {
    rule: RecurringRule
    accountName?: string
    onPress: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const currency = useUserStore((s) => s.currency)
    const { getCategory } = useCategories()

    const info = getCategory(rule.category, rule.type)
    const status = getRecurringStatus(rule)
    const isIncome = rule.type === "INCOME"

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-card rounded-2xl border border-line p-4 mb-3"
            style={{ opacity: status === "active" ? 1 : 0.65 }}
        >
            <View className="flex-row items-center">
                <View
                    className="w-11 h-11 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${info.color}22` }}
                >
                    <Text>{info.icon}</Text>
                </View>

                <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                        <Text className="text-ink text-sm font-medium flex-shrink" numberOfLines={1}>
                            {rule.name}
                        </Text>
                        {status !== "active" && (
                            <View className="ml-2 px-2 py-0.5 rounded-full bg-line-soft">
                                <Text className="text-subtle text-[10px] font-medium">
                                    {t(`recurring.status.${status}`)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-brand-text-secondary text-[11px] mt-0.5" numberOfLines={1}>
                        {getScheduleLabel(rule, t)}
                        {accountName ? ` · ${accountName}` : ""}
                    </Text>
                </View>

                <Text
                    className="text-sm font-semibold"
                    style={{ color: isIncome ? INCOME_COLOR : EXPENSE_COLOR }}
                >
                    {isIncome ? "+" : "-"}
                    {formatPrice(Number(rule.amount), currency)}
                </Text>
            </View>

            {status === "active" && (
                <View className="flex-row items-center mt-3">
                    <Feather name="repeat" size={12} color={colors.subtle} />
                    <Text className="text-subtle text-[11px] ml-1.5">{getNextRunLabel(rule, t)}</Text>
                </View>
            )}
            {rule.end_date && (
                <Text className="text-subtle text-[11px] mt-1">
                    {t("recurring.endDate")} · {formatDate(parseDeadline(rule.end_date), "d MMM yyyy")}
                </Text>
            )}
        </TouchableOpacity>
    )
}

export default function RecurringScreen() {
    const router = useRouter()
    const { t } = useTranslation()
    const colors = useThemeColors()
    const currency = useUserStore((s) => s.currency)

    const recurringQuery = useRecurringQuery()
    const accountsQuery = useAccountsQuery()
    const { mutate: processDue } = useProcessRecurringRules()

    const { refetch: refetchRules } = recurringQuery

    useFocusEffect(
        useCallback(() => {
            processDue()
            refetchRules()
        }, [processDue, refetchRules])
    )

    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const rules = recurringQuery.data
    const sorted = useMemo(() => sortRecurringRules(rules ?? []), [rules])
    const summary = useMemo(() => summarizeRecurring(rules ?? []), [rules])
    const editing = (rules ?? []).find((r) => r.id === editingId) ?? null

    const accountName = useMemo(() => {
        const map = new Map<string, string>()
        for (const a of accountsQuery.data ?? []) map.set(a.id, a.name)
        return map
    }, [accountsQuery.data])

    const isLoading = recurringQuery.isLoading
    const isError = recurringQuery.isError
    if (isError) console.log("RECURRING ERROR", recurringQuery.error)

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
            <View className="flex-row items-center px-5 pt-3 pb-3 gap-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={8}
                    className="w-10 h-10 rounded-full bg-card border border-line items-center justify-center"
                >
                    <Feather name="arrow-left" size={18} color={colors.ink} />
                </TouchableOpacity>
                <Text className="flex-1 text-ink text-lg font-medium">{t("recurring.title")}</Text>
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
                        onPress={() => refetchRules()}
                        activeOpacity={0.7}
                        className="bg-card rounded-2xl border border-line px-4 py-5 items-center mt-2"
                    >
                        <Feather name="refresh-cw" size={16} color={colors.icon} />
                        <Text className="text-brand-coral text-xs text-center mt-2">
                            {t("recurring.loadFailedScreen")}
                        </Text>
                    </TouchableOpacity>
                ) : sorted.length === 0 ? (
                    <View className="bg-card rounded-2xl border border-line px-4 py-6 mt-2 items-center">
                        <View className="w-12 h-12 rounded-full bg-page items-center justify-center mb-3">
                            <Feather name="repeat" size={20} color={colors.icon} />
                        </View>
                        <Text className="text-ink text-sm font-medium text-center mb-1">
                            {t("recurring.empty")}
                        </Text>
                        <Text className="text-subtle text-xs text-center mb-4">
                            {t("recurring.emptyHint")}
                        </Text>
                        <TouchableOpacity
                            onPress={openCreate}
                            className="bg-solid rounded-xl px-5 py-3"
                            activeOpacity={0.85}
                        >
                            <Text className="text-on-solid text-sm font-semibold">
                                {t("recurring.createFirst")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View className="bg-card rounded-[18px] border border-line p-4 mb-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-ink text-sm font-medium">
                                    {t("recurring.summaryActive", { count: summary.activeCount })}
                                </Text>
                                {summary.pausedCount > 0 && (
                                    <Text className="text-subtle text-[11px]">
                                        {t("recurring.summaryPaused", { count: summary.pausedCount })}
                                    </Text>
                                )}
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <Text className="text-subtle text-[11px] mb-0.5">
                                        {t("recurring.monthlyExpense")}
                                    </Text>
                                    <Text className="text-sm font-semibold" style={{ color: EXPENSE_COLOR }}>
                                        {formatPrice(Math.round(summary.monthlyExpense), currency)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-subtle text-[11px] mb-0.5">
                                        {t("recurring.monthlyIncome")}
                                    </Text>
                                    <Text className="text-sm font-semibold" style={{ color: INCOME_COLOR }}>
                                        {formatPrice(Math.round(summary.monthlyIncome), currency)}
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-subtle text-[10px] mt-3">{t("recurring.summaryNote")}</Text>
                        </View>

                        {sorted.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                accountName={accountName.get(rule.account_id)}
                                onPress={() => openEdit(rule.id)}
                            />
                        ))}

                    </>
                )}
            </ScrollView>

            <RecurringSheet
                visible={sheetOpen}
                rule={editing}
                onClose={() => setSheetOpen(false)}
                onSaved={() => setSheetOpen(false)}
                onDeleted={() => setSheetOpen(false)}
            />
        </SafeAreaView>
    )
}