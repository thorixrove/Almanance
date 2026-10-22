import { BottomSheet } from "@/components/BottomSheet"
import { COLORS } from "@/constants/theme"
import {
    useCreateRecurringRule,
    useDeleteRecurringRule,
    useUpdateRecurringRule,
} from "@/hooks/mutation/useRecurringMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { useCategories } from "@/hooks/useCategories"
import { formatDate } from "@/lib/i18n/dateLocale"
import {
    isRecurringEndedError,
    isRecurringInvalidRefError,
    isRecurringLimitError,
    isRecurringStartDateError,
} from "@/lib/services/recurring"
import { amountToInput, formatAmountInput, parseAmount } from "@/lib/utils"
import { parseDeadline, toDeadlineString } from "@/lib/utils/goals"
import { getScheduleLabel, hasMonthEndClamp } from "@/lib/utils/recurring"
import type { RecurringFrequency, RecurringRule } from "@/types/recurring"
import type { TransactionType } from "@/types/transaction"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    Alert,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { RecurringCategoryPicker } from "./RecurringCategoryPicker"
import { RecurringChoiceChips } from "./RecurringChoiceChips"
import { RecurringDateField } from "./RecurringDateField"
import { RecurringTypeToggle } from "./RecurringTypeToggle"

const NAME_MAX_LENGTH = 40

const FREQUENCIES: RecurringFrequency[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]

export function RecurringSheet({
    visible,
    rule,
    onClose,
    onSaved,
    onDeleted,
}: {
    visible: boolean
    rule: RecurringRule | null
    onClose: () => void
    onSaved: () => void
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const isEditing = !!rule

    const categories = useCategories()
    const accountsQuery = useAccountsQuery()

    const [type, setType] = useState<TransactionType>("EXPENSE")
    const [name, setName] = useState("")
    const [amount, setAmount] = useState("")
    const [categoryKey, setCategoryKey] = useState<string | null>(null)
    const [accountId, setAccountId] = useState<string | null>(null)
    const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY")
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [startPickerOpen, setStartPickerOpen] = useState(false)
    const [endPickerOpen, setEndPickerOpen] = useState(false)
    const [active, setActive] = useState(true)
    const [error, setError] = useState("")

    const { mutateAsync: createRule, isPending: creating } = useCreateRecurringRule()
    const { mutateAsync: updateRule, isPending: updating } = useUpdateRecurringRule()
    const { mutateAsync: deleteRule } = useDeleteRecurringRule()
    const saving = creating || updating

    const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data])

    useEffect(() => {
        if (!visible) return

        setType(rule?.type ?? "EXPENSE")
        setName(rule?.name ?? "")
        setAmount(rule ? amountToInput(Number(rule.amount)) : "")
        setCategoryKey(rule?.category ?? null)
        setFrequency(rule?.frequency ?? "MONTHLY")
        setStartDate(rule ? parseDeadline(rule.start_date) : new Date())
        setEndDate(rule?.end_date ? parseDeadline(rule.end_date) : null)
        setStartPickerOpen(false)
        setEndPickerOpen(false)
        setActive(rule?.is_active ?? true)
        setAccountId(rule?.account_id ?? null)
        setError("")
    }, [visible, rule])


    useEffect(() => {
        if (!visible || rule || accountId || accounts.length === 0) return
        const fallback = accounts.find((a) => a.is_default) ?? accounts[0]
        setAccountId(fallback.id)
    }, [visible, rule, accountId, accounts])

    const categoryList = type === "INCOME" ? categories.income : categories.expense
    const loading = categories.isLoading || accountsQuery.isLoading
    const loadFailed = categories.isError || accountsQuery.isError

    const handleRetry = () => {
        if (categories.isError) categories.refetch()
        if (accountsQuery.isError) accountsQuery.refetch()
    }

    const handleChangeType = (next: TransactionType) => {
        if (next === type) return
        setType(next)
        setCategoryKey(null)
        setError("")
    }

    const handleSave = async () => {
        const trimmed = name.trim()
        if (!trimmed) {
            setError("recurring.nameRequired")
            return
        }

        const parsed = parseAmount(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setError("recurring.amountInvalid")
            return
        }

        if (!categoryKey) {
            setError("recurring.categoryRequired")
            return
        }

        if (!accountId) {
            setError("recurring.accountRequired")
            return
        }

        const startStr = toDeadlineString(startDate)
        const endStr = endDate ? toDeadlineString(endDate) : null

        if (!rule && startStr < toDeadlineString(new Date())) {
            setError("recurring.startInPast")
            return
        }

        if (endStr && endStr < startStr) {
            setError("recurring.endBeforeStart")
            return
        }

        setError("")

        try {
            if (rule) {
                await updateRule({
                    id: rule.id,
                    patch: {
                        account_id: accountId,
                        amount: parsed,
                        category: categoryKey,
                        name: trimmed,
                        end_date: endStr,
                        is_active: active
                    },
                })
            } else {
                await createRule({
                    account_id: accountId,
                    type,
                    amount: parsed,
                    category: categoryKey,
                    name: trimmed,
                    frequency,
                    start_date: startStr,
                    end_date: endStr,
                })
            }
            onSaved()
        } catch (error) {
            if (isRecurringLimitError(error)) setError("recurring.limitReached")
            else if (isRecurringStartDateError(error)) setError("recurring.startInPast")
            else if (isRecurringEndedError(error)) setError("recurring.ended")
            else if (isRecurringInvalidRefError(error)) setError("recurring.invalidRef")
            else setError("recurring.saveFailed")
        }
    }

    const handleDelete = () => {
        if (!rule) return

        Alert.alert(
            t("recurring.delete"),
            t("recurring.deleteConfirm", { name: rule.name }),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("recurring.delete"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteRule(rule.id)
                            onDeleted
                        } catch {
                            Alert.alert(t("common.error"), t("recurring.deleteFailed"))
                        }
                    },
                },
            ]
        )

    }

    const disabled = saving || loading || loadFailed

    const footer = (
        <>
            {error ? (
                <Text>{t(error)}</Text>
            ) : null}

            <TouchableOpacity
                onPress={handleSave}
                disabled={disabled}
                className="bg-solid rounded-xl py-4 items-center"
                style={{ opacity: disabled ? 0.5 : 1 }}
                activeOpacity={0.85}
            >
                <Text className="text-on-solid text-sm font-semibold">
                    {saving
                        ? t("common.saving")
                        : isEditing
                            ? t("recurring.saveChanges")
                            : t("recurring.add")
                    }
                </Text>
            </TouchableOpacity>
        </>
    )

    const showMonthEndNote = !isEditing
        ? hasMonthEndClamp(frequency, toDeadlineString(startDate))
        : rule
            ? hasMonthEndClamp(rule.frequency, rule.start_date)
            : false

    const frequencyOptions = FREQUENCIES.map((f) => ({
        key: f,
        label: t(`recurring.frequencies.${f}`),
    }))

    const accountOptions = accounts.map((a) => ({ key: a.id, label: a.name }))

    return (
        <BottomSheet
            visible={visible}
            title={isEditing ? t("recurring.editTitle") : t("recurring.addTitle")}
            onClose={onClose}
            footer={footer}
        >
            <RecurringTypeToggle value={type} locked={isEditing} onChange={handleChangeType} />

            <Text className="text-ink text-xs font-medium mb-1.5">{t("recurring.name")}</Text>
            <TextInput
                value={name}
                onChangeText={(v) => {
                    setError("")
                    setName(v)
                }}
                maxLength={NAME_MAX_LENGTH}
                placeholder={t("recurring.namePlaceholder")}
                placeholderTextColor={COLORS.placeholder}
                className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
            />

            <Text className="text-ink text-xs font-medium mb-1.5">{t("recurring.amount")}</Text>
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
            <Text className="text-ink text-xs font-medium mb-1.5">{t("recurring.category")}</Text>
            <RecurringCategoryPicker
                items={categoryList}
                selectedKey={categoryKey}
                loading={loading}
                failed={loadFailed}
                onSelect={(key) => {
                    setError("")
                    setCategoryKey(key)
                }}
                onRetry={handleRetry}
            />
            <Text className="text-ink text-xs font-medium mb-1.5">{t("recurring.account")}</Text>
            <RecurringChoiceChips
                options={accountOptions}
                selected={accountId}
                onSelect={(key) => {
                    setError("")
                    setAccountId(key)
                }}
            />

            <Text className="text-ink text-xs font-medium mb-1.5">{t("recurring.frequency")}</Text>
            {isEditing && rule ? (
                <View className="bg-card border border-line rounded-xl px-4 py-3.5 mb-5">
                    <Text className="text-ink text-sm">{getScheduleLabel(rule, t)}</Text>
                    <Text className="text-subtle text-[11px] mt-0.5">
                        {t("recurring.startDate")} · {formatDate(startDate, "d MMMM yyyy")}
                    </Text>
                </View>
            ) : (
                <>
                    <RecurringChoiceChips
                        options={frequencyOptions}
                        selected={frequency}
                        onSelect={(key) => setFrequency(key as RecurringFrequency)}
                    />
                    <RecurringDateField
                        className="mb-5"
                        label={t("recurring.startDate")}
                        value={startDate}
                        open={startPickerOpen}
                        onToggle={() => setStartPickerOpen((v) => !v)}
                        onChange={(selected) => {
                            setError("")
                            setStartDate(selected)
                            setStartPickerOpen(false)
                        }}
                    />
                </>
            )}


            <RecurringDateField
                label={t("recurring.endDate")}
                value={endDate}
                pickerValue={startDate}
                placeholder={t("recurring.noEndDate")}
                clearLabel={t("recurring.clearEndDate")}
                open={endPickerOpen}
                onToggle={() => setEndPickerOpen((v) => !v)}
                onChange={(selected) => {
                    setError("")
                    setEndDate(selected)
                    setEndPickerOpen(false)
                }}
                onClear={() => {
                    setError("")
                    setEndDate(null)
                    setEndPickerOpen(false)
                }}
            />
            {showMonthEndNote && (
                <Text className="text-subtle text-[11px] mt-1.5">{t("recurring.monthEndNote")}</Text>
            )}
            {isEditing && (
                <View className="flex-row items-center bg-card border border-line rounded-xl px-4 py-3 mt-5">
                    <Text className="flex-1 text-ink text-sm">{t("recurring.active")}</Text>
                    <Switch value={active} onValueChange={setActive} />
                </View>
            )}
            <Text className="text-subtle text-[11px] mt-4 mb-2">
                {isEditing ? t("recurring.sheetNote") : ""}
            </Text>
            {isEditing && (
                <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
                    <Text className="text-brand-coral text-sm font-medium">{t("recurring.delete")}</Text>
                </TouchableOpacity>
            )}
        </BottomSheet>
    )
}