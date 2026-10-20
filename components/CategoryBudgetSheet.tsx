import { useThemeColors } from "@/components/ThemeProvider"
import { COLORS } from "@/constants/theme"
import {
    useCreateCategoryBudget,
    useDeleteCategoryBudget,
    useUpdateCategoryBudget,
} from "@/hooks/mutation/useCategoryBudgetMutations"
import { useCategoryBudgetsQuery } from "@/hooks/queries/useCategoryBudgetsQuery"
import { useCategories } from "@/hooks/useCategories"
import {
    isCategoryBudgetDuplicateError,
    isCategoryBudgetLimitError,
} from "@/lib/services/categoryBudgets"
import { amountToInput, formatAmountInput, parseAmount } from "@/lib/utils"
import type { CategoryBudget } from "@/types/categoryBudget"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { BottomSheet } from "./BottomSheet"


export function CategoryBudgetSheet({
    visible,
    budget,
    onClose,
    onSaved,
    onDeleted,
}: {
    visible: boolean
    budget: CategoryBudget | null
    onClose: () => void
    onSaved: () => void
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const colors = useThemeColors()
    const isEditing = !!budget

    const categories = useCategories()
    const budgetQuery = useCategoryBudgetsQuery()

    const [categoryKey, setCategoryKey] = useState<string | null>(null)
    const [amount, setAmount] = useState("")
    const [error, setError] = useState("")

    const { mutateAsync: createBudget, isPending: creating } = useCreateCategoryBudget()
    const { mutateAsync: updateBudget, isPending: updating } = useUpdateCategoryBudget()
    const { mutateAsync: deleteBudget } = useDeleteCategoryBudget()
    const saving = creating || updating

    useEffect(() => {
        if (visible) {
            setCategoryKey(budget?.category ?? null)
            setAmount(budget ? amountToInput(budget.amount) : "")
            setError("")
        }
    }, [visible, budget])

    const available = useMemo(() => {
        const taken = new Set((budgetQuery.data ?? []).map((b) => b.category as string))
        return categories.expense.filter((c) => !taken.has(c.key as string))
    }, [categories.expense, budgetQuery.data])

    const loading = categories.isLoading || budgetQuery.isLoading
    const loadFailed = categories.isError || budgetQuery.isError
    const allUsed = !isEditing && !loading && !loadFailed && available.length === 0

    const handleRetry = () => {
        if (categories.isError) categories.refetch()
        if (budgetQuery.isError) budgetQuery.refetch()
    }

    const handleSave = async () => {
        if (!categoryKey) {
            setError("categoryBudget.categoryRequired")
            return
        }

        const parsed = parseAmount(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setError("categoryBudget.amountInvalid")
            return
        }

        setError("")

        try {
            if (budget) {
                await updateBudget({ id: budget.id, amount: parsed })
            } else {
                await createBudget({ category: categoryKey, amount: parsed })
            }
            onSaved()
        } catch (error) {
            if (isCategoryBudgetLimitError(error)) setError("categoryBudget.limitReached")
            else if (isCategoryBudgetDuplicateError(error)) setError("categoryBudget.duplicate")
            else setError("addTransaction.saveFailed")
        }
    }

    const handleDelete = () => {
        if (!budget) return
        const label = categories.getLabel(budget.category)

        Alert.alert(
            t("categoryBudget.delete"),
            t("categoryBudget.deleteConfirm", { name: label }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("categoryBudget.delete"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteBudget(budget.id)
                            onDeleted()
                        } catch {
                            Alert.alert(t("common.error"), t("categoryBudget.deleteFailed"))
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
            disabled={saving || loading || loadFailed || allUsed}
            className="bg-solid rounded-xl py-4 items-center"
            style={{ opacity: saving || loading || loadFailed || allUsed ? 0.5 : 1}}
            activeOpacity={0.85}
            >
                <Text className="text-on-solid texxt-sm font-semibold">
                    {saving ? t("common.saving") : isEditing ? t("categoryBudget.saveChanges") : t("categoryBudget.add")}
                </Text>
            </TouchableOpacity>
        </>
    )

    const editingInfo = budget ? categories.getCategory(budget.category) : null

    return (
        <BottomSheet
            visible={visible}
            title={isEditing ? t("categoryBudget.editTitle") : t("categoryBudget.addTitle")}
            onClose={onClose}
            footer={footer}
        >
            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("categoryBudget.category")}
            </Text>

            {isEditing && editingInfo ? (
                <View className="flex-row items-center bg-card border border-line rounded-xl px-4 py-3.5 mb-5">
                    <View
                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${editingInfo.color}22` }}
                    >
                        <Text className="text-lg">{editingInfo.icon}</Text>
                    </View>
                    <Text className="text-ink text-sm font-medium">{editingInfo.label}</Text>
                </View>
            ) : loading ? (
                <View className="py-6 items-center mb-5">
                    <ActivityIndicator color={colors.icon} />
                </View>
            ) : loadFailed ? (
                <View className="items-center py-4 mb-5">
                    <Text className="text-subtle text-sm mb-2">
                        {t("categoryBudget.loadFailed")}
                    </Text>
                    <TouchableOpacity onPress={handleRetry} hitSlop={8}>
                        <Text className="text-ink text-sm font-semibold">
                            {t("categoryBudget.retry")}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : allUsed ? (
                <Text className="text-subtle text-sm mb-5">{t("categoryBudget.allUsed")}</Text>
            ) : (
                <View className="flex-row flex-wrap gap-2 mb-5">
                    {available.map((c) => {
                        const selected = categoryKey === c.key
                        return (
                            <TouchableOpacity
                                key={c.key}
                                onPress={() => {
                                    setError("")
                                    setCategoryKey(c.key)
                                }}
                                className="flex-row items-center rounded-full px-3 py-2 border"
                                style={{
                                    borderColor: selected ? c.color : colors.line,
                                    backgroundColor: selected ? `${c.color}22` : colors.card,
                                    borderWidth: selected ? 1.5 : 1,
                                }}
                            >
                                <Text className="text-base mr-1.5">{c.icon}</Text>
                                <Text className="text-ink text-xs font-medium">{c.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            )}

            <Text className="text-ink text-xs font-medium mb-1.5">
                {t("categoryBudget.amount")}
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
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
            />

            {isEditing && (
                <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
                    <Text className="text-brand-coral text-sm font-medium">
                        {t("categoryBudget.delete")}
                    </Text>
                </TouchableOpacity>
            )}
        </BottomSheet>
    )

}