import { DateRangeSheet } from "@/components/DateRangeSheet"
import { EditTransactionModal } from "@/components/EditTransactionModal"
import { TransactionRow } from "@/components/TransactionRow"
import { useDeleteTransactions, useDeleteTransactionsBulk } from "@/hooks/mutation/useTransactionMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import { Transaction, TransactionType } from "@/lib/services/transactions"
import {
  ALL_TIME,
  DateRange,
  formatRangeLabel,
  toFilterDates,
} from "@/lib/utils/dateRange"
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions"
import { ListTransaction, mergeTransferLegs } from "@/lib/utils/transfer"
import { Feather } from "@expo/vector-icons"
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { getCategoryLabel } from "@/constants/categories"
import { formatDate } from "@/lib/i18n/dateLocale"
import { useThemeColors } from "@/components/ThemeProvider"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { BarChart } from "react-native-gifted-charts"
import { SafeAreaView } from "react-native-safe-area-context"


const FILTERS = ["ALL", "Income", "Expense"] as const

const FILTER_LABEL_KEYS = {
  ALL: "transactions.filterAll",
  Income: "transactions.filterIncome",
  Expense: "transactions.filterExpense",
} as const

// Transaksi saldo awal dari onboarding bukan pemasukan sungguhan,
// jadi tidak ikut dihitung di grafik harian.
const STARTING_BALANCE_DESCRIPTION = "Starting balance"

// Lebih dari ini -> grafik dikelompokkan per bulan supaya tetap terbaca.
const MAX_DAILY_BARS = 62

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function monthKey(date: Date) {
  return format(date, "yyyy-MM")
}

// Tentukan bucket grafik dari rentang tanggal. Tanpa rentang (All time),
// grafik tetap menampilkan bulan berjalan seperti sebelumnya.
function buildChartBuckets(range: DateRange) {
  const today = startOfDay(new Date())
  const from =
    range.from && range.to ? startOfDay(range.from) : startOfMonth(today)
  const rawTo = range.from && range.to ? startOfDay(range.to) : today
  const to = rawTo > today ? today : rawTo

  if (from > to) {
    return { monthly: false, keyOf: dayKey, buckets: [] as { key: string; label: string }[] }
  }

  if (differenceInCalendarDays(to, from) + 1 > MAX_DAILY_BARS) {
    return {
      monthly: true,
      keyOf: monthKey,
      buckets: eachMonthOfInterval({ start: from, end: to }).map((d) => ({
        key: monthKey(d),
        label: formatDate(d, "MMM yy"),
      })),
    }
  }

  return {
    monthly: false,
    keyOf: dayKey,
    buckets: eachDayOfInterval({ start: from, end: to }).map((d) => ({
      key: dayKey(d),
      label: formatDate(d, "d MMM"),
    })),
  }
}

export default function TransactionsScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const colors = useThemeColors()

  const [activeFilters, setActiveFilters] = 
  useState <(typeof FILTERS)[number]>("ALL")
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME)
  const [rangeSheetOpen, setRangeSheetOpen] = useState(false)
  const rangeActive = dateRange.preset !== "ALL"

  // Multi-select state: entered via long-press on a row or the header
  // "Select" button. While active, tapping rows toggles selection instead
  // of the normal swipe-to-delete / navigate behavior.
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Snapshot transaksi yang sedang diedit. Disimpan sebagai state (bukan dicari
  // ulang dari list) supaya refetch tidak me-reset isian form saat user mengetik.
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)


  const typeFilter: TransactionType | null =
  activeFilters === "Income"
  ? "INCOME"
  : activeFilters === "Expense"
  ? "EXPENSE"
  : null

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery({
    type: typeFilter,
    accountId: activeAccountId,
    ...toFilterDates(dateRange),
  })
  const { data: accounts = [], refetch: refetchAccounts} = useAccountsQuery()
  const { mutateAsync: removeTransactions} = useDeleteTransactions()
  const { mutateAsync: removeTransactionsBulk, isPending: bulkDeleting } = useDeleteTransactionsBulk()

  const loading = transactionsLoading
  const refreshing = transactionsRefetching
  const error = transactionsError

  const loadData = () => {
    refetchTransactions()
    refetchAccounts()
  }

  // Dua sisi satu transfer digabung jadi satu baris untuk daftar.
  const listItems = useMemo(
    () => mergeTransferLegs(transactions, accounts),
    [transactions, accounts]
  )

  const filterTransactions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        getCategoryLabel(tx.category).toLowerCase().includes(q) ||
        tx.transfer?.fromName.toLowerCase().includes(q) ||
        tx.transfer?.toName.toLowerCase().includes(q)
    )
  }, [listItems, search, t])

  const chart = useMemo(() => buildChartBuckets(dateRange), [dateRange, i18n.language])

  const dailyIncomeExpense = useMemo(() => {
    const income = new Map<string, number>()
    const expense = new Map<string, number>()

    for (const tx of transactions) {
      const key = chart.keyOf(new Date(tx.date))
      if (tx.type === "INCOME") {
        if (tx.description === STARTING_BALANCE_DESCRIPTION) continue
        income.set(key, (income.get(key) ?? 0) + tx.amount)
      } else if (tx.type === "EXPENSE") {
        expense.set(key, (expense.get(key) ?? 0) + tx.amount)
      }
    }

    return chart.buckets.flatMap(({ key, label }) => [
      { value: income.get(key) ?? 0, label, frontColor: "#3DDC84" },
      { value: expense.get(key) ?? 0, frontColor: "#FF6B4A" },
    ])
  }, [transactions, chart])

  const handleApplyRange = (range: DateRange) => {
    setDateRange(range)
    // Pilihan lama bisa berisi transaksi yang sudah tidak tampil.
    setSelectedIds(new Set())
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const {count} = await exportTransactionsToCsv(transactions, {
        applyWindow: !rangeActive,
      })
      if (count === 0) {
        Alert.alert(
          t("transactions.nothingToExport"),
          rangeActive
            ? t("transactions.noneInRange")
            : t("transactions.noneInWindow")
        )
      }
    } catch (error) {
      console.error("Expoert failed", error)
      Alert.alert(t("common.error"), t("transactions.exportFailed"))
    } finally {
      setExporting(false)
    }
  }

  // Stable reference (only changes if removeTransactions itself changes),
  // so TransactionRow's React.memo can actually skip re-renders.
  // Takes the tx as an argument instead of being wrapped per-item.
  const handelDelete = useCallback(
    (tx: Transaction) => {
      const transferId = (tx as Transaction & { transfer_id?: string | null }).transfer_id
      Alert.alert(
        t("transactions.deleteTitle"),
        transferId
          ? t("transactions.deleteTransferMessage")
          : t("transactions.deleteMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("transactions.delete"),
            style: "destructive",
            onPress: async () => {
              const { error: deleteError } = await removeTransactions(tx)
              if (deleteError) {
                Alert.alert(t("common.error"), t("transactions.deleteFailed"))
              }
            },
          },
        ]
      )
    },
    [removeTransactions, t]
  )

  // Ketuk baris -> buka form edit. Saldo awal dikunci karena dikenali lewat
  // deskripsinya; kalau deskripsi diubah, ia akan dihitung sebagai pemasukan biasa.
  const handleEdit = useCallback((tx: Transaction) => {
    if (tx.description === STARTING_BALANCE_DESCRIPTION) {
      Alert.alert(
        t("transactions.startingBalanceTitle"),
        t("transactions.startingBalanceMessage")
      )
      return
    }
    setEditingTx(tx)
  }, [t])

  // Long-pressing any row (when not already selecting) enters selection
  // mode and selects that row.
  const handleLongPress = useCallback((tx: Transaction) => {
    setSelectionMode(true)
    setSelectedIds(new Set([tx.id]))
  }, [])

  const handleToggleSelect = useCallback((tx: Transaction) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tx.id)) {
        next.delete(tx.id)
      } else {
        next.add(tx.id)
      }
      return next
    })
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleDeleteSelected = useCallback(() => {
    const selected = transactions.filter((tx) => selectedIds.has(tx.id))
    if (selected.length === 0) return
    const hasTransfer = selected.some(
      (tx) => (tx as Transaction & { transfer_id?: string | null }).transfer_id
    )

    Alert.alert(
      t("transactions.deleteSelectedTitle"),
      (selected.length > 1
        ? t("transactions.deleteSelectedMany", { count: selected.length })
        : t("transactions.deleteSelectedOne", { count: selected.length })) +
        (hasTransfer ? t("transactions.deleteSelectedTransferNote") : ""),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("transactions.delete"),
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await removeTransactionsBulk(selected)
            if (deleteError) {
              Alert.alert(t("common.error"), t("transactions.deleteSelectedFailed"))
              return
            }
            exitSelectionMode()
          },
        },
      ]
    )
  }, [transactions, selectedIds, removeTransactionsBulk, exitSelectionMode, t])

  // Stable renderItem reference so FlatList doesn't treat every parent
  // re-render (typing in search, toggling filters, selecting rows) as a
  // reason to re-create and re-render every visible row.
  const renderItem: ListRenderItem<ListTransaction> = useCallback(
    ({ item }) => (
      <TransactionRow
        tx={item}
        onDelete={selectionMode ? undefined : handelDelete}
        onLongPress={selectionMode ? undefined : handleLongPress}
        selectionMode={selectionMode}
        selected={selectedIds.has(item.id)}
        onToggleSelect={handleToggleSelect}
        onEdit={selectionMode ? undefined : handleEdit}
      />
    ),
    [selectionMode, selectedIds, handelDelete, handleLongPress, handleToggleSelect, handleEdit]
  )

  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-ink text-xl font-semibold">
            {selectionMode
              ? t("transactions.selectedCount", { count: selectedIds.size })
              : t("transactions.title")}
          </Text>

          {selectionMode ? (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  selectedIds.size === 0 ? "bg-card border border-line" : "bg-brand-coral"
                }`}
              >
                {bulkDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather
                    name="trash-2"
                    size={15}
                    color={selectedIds.size === 0 ? "#8A8D96" : "#fff"}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={exitSelectionMode}
                className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
              >
                <Feather name="x" size={15} color={colors.icon} />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setSelectionMode(true)}
                className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
              >
                <Feather name="check-square" size={15} color={colors.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                disabled={exporting}
                className="w-9 h-9 rounded-full bg-card border border-line items-center justify-center"
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.icon} />
                ) : (
                  <Feather name="download" size={15} color={colors.icon} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 bg-card rounded-xl border border-line px-3.5 py-2.5 mb-2.5">
          <Feather name="search" size={15} color="#8A8D96" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("transactions.searchPlaceholder")}
            placeholderTextColor="#8A8D96"
            className="flex-1 text-xs text-ink"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="#8A8D96" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-2 mb-2.5">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilters(filter)}
              className={`px-3.5 py-1.5 rounded-full border ${
                activeFilters === filter
                  ? "bg-solid border-solid"
                  : "bg-card border-line"
              }`}
            >
              <Text
                className={`text-xs ${
                  activeFilters === filter
                    ? "text-on-solid"
                    : "text-brand-text-secondary"
                }`}
              >
                {t(FILTER_LABEL_KEYS[filter])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`px-3.5 py-1.5 rounded-full border ${
                activeAccountId === null
                  ? "bg-solid border-solid"
                  : "bg-card border-line"
              }`}
            >
              <Text
                className={`text-xs ${
                  activeAccountId === null
                    ? "text-on-solid"
                    : "text-brand-text-secondary"
                }`}
              >
                {t("transactions.allAccounts")}
              </Text>
            </TouchableOpacity>
            {accounts.map((accounts) => (
             <TouchableOpacity
                key={accounts.id}
                onPress={() => setActiveAccountId(accounts.id)}
                className={`px-3.5 py-1.5 rounded-full border ${
                  activeAccountId === accounts.id
                    ? "bg-solid border-solid"
                    : "bg-card border-line"
                }`}
              >
                <Text
                  className={`text-xs ${
                    activeAccountId === accounts.id
                      ? "text-on-solid"
                      : "text-brand-text-secondary"
                  }`}
                >
                  {accounts.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row items-center gap-2 mt-2.5">
          <TouchableOpacity
            onPress={() => setRangeSheetOpen(true)}
            className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${
              rangeActive ? "bg-solid border-solid" : "bg-card border-line"
            }`}
          >
            <Feather
              name="calendar"
              size={12}
              color={rangeActive ? colors.onSolid : colors.icon}
            />
            <Text
              className={`text-xs ${
                rangeActive ? "text-on-solid" : "text-brand-text-secondary"
              }`}
            >
              {formatRangeLabel(dateRange)}
            </Text>
          </TouchableOpacity>
          {rangeActive && (
            <TouchableOpacity
              onPress={() => handleApplyRange(ALL_TIME)}
              className="w-7 h-7 rounded-full bg-card border border-line items-center justify-center"
            >
              <Feather name="x" size={13} color="#8A8D96" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A9EFF" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Feather name="alert-circle" size={32} color="#FF6B4A" />
          <Text className="text-subtle text-sm mt-3 text-center">
            {t("transactions.loadError")}
            </Text>
          <TouchableOpacity
            onPress={() => loadData()}
            className="mt-4 bg-solid rounded-full px-4 py-2"
          >
            <Text className="text-on-solid text-xs font-medium">{t("transactions.retry")}</Text>
            </TouchableOpacity>
          </View>
      ) : (
        <FlatList
          data={filterTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
              enabled={!selectionMode}
            />
          }
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={
            transactions.length > 0 && !selectionMode ? (
              <View className="bg-card rounded-2xl border border-line p-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-success" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        {t("transactions.income")}
                        </Text>
                      </View>

                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-coral" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        {t("transactions.expense")}
                          </Text>
                          </View>
                        </View>
                    </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <BarChart
                          data={dailyIncomeExpense}
                          width={Math.max(dailyIncomeExpense.length * 9, 280)}
                          height={120}
                          barWidth={6}
                          spacing={4}
                          hideYAxisText
                          xAxisColor={colors.line}
                          yAxisColor="transparent"
                          rulesColor={colors.lineSoft}
                          noOfSections={3}
                          xAxisLabelTextStyle={{ color: "#8A8D96", fontSize: 7 }}
                          isThreeD={false}
                          roundedTop
                        />
                    </ScrollView>
                  </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Feather name="inbox" size={32} color={colors.subtle} />
              <Text className="text-subtle text-sm mt-3">
                {search
                  ? t("transactions.emptySearch")
                  : rangeActive
                  ? t("transactions.emptyRange")
                  : t("transactions.empty")}
              </Text>
            </View>
          }
          />
        )}


      <DateRangeSheet
        visible={rangeSheetOpen}
        value={dateRange}
        onClose={() => setRangeSheetOpen(false)}
        onApply={handleApplyRange}
      />

      <EditTransactionModal
        visible={editingTx !== null}
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSaved={() => setEditingTx(null)}
      />

        {/* Add trancation FAB - nvaigate to the Add tab */}
      {/* <TouchableOpacity
        onPress={() => router.push("/(root)/(tabs)/add-transaction")}
        className="absolute right-5 w-14 h-14 rounded-full bg-brand-bg items-center justify-center shadow-lg"
        style={{ bottom: 90 }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity> */}
    </SafeAreaView>
  )
}