import { DateRangeSheet } from "@/components/DateRangeSheet"
import { EditTransactionModal } from "@/components/EditTransactionModal"
import { TransactionRow } from "@/components/TransactionRow"
import { AccountFilterChips } from "@/components/transactions/AccountFilterChips"
import { DateRangeFilterButton } from "@/components/transactions/DateRangeFilterButton"
import { TransactionChart } from "@/components/transactions/TransactionChart"
import { TransactionSearchBar } from "@/components/transactions/TransactionSearchBar"
import { FILTERS, TransactionTypeFilter } from "@/components/transactions/TransactionTypeFilter"
import { TransactionsEmptyState } from "@/components/transactions/TransactionsEmptyState"
import { TransactionsErrorState } from "@/components/transactions/TransactionsErrorState"
import { TransactionsHeader } from "@/components/transactions/TransactionsHeader"
import { useDeleteTransactions, useDeleteTransactionsBulk } from "@/hooks/mutation/useTransactionMutations"
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import { Transaction, TransactionType } from "@/lib/services/transactions"
import {
  ALL_TIME,
  DateRange,
  toFilterDates,
} from "@/lib/utils/dateRange"
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions"
import { buildChartBuckets } from "@/lib/utils/transactionChart"
import { ListTransaction, mergeTransferLegs } from "@/lib/utils/transfer"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useCategories } from "@/hooks/useCategories"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const STARTING_BALANCE_DESCRIPTION = "Starting balance"

export default function TransactionsScreen() {
  const router = useRouter()
  const { t, i18n } = useTranslation()

  const [activeFilters, setActiveFilters] =
    useState<(typeof FILTERS)[number]>("ALL")
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME)
  const [rangeSheetOpen, setRangeSheetOpen] = useState(false)
  const rangeActive = dateRange.preset !== "ALL"


  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())


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
    ...toFilterDates(dateRange)
  })
  const { data: accounts = [], refetch: refetchAccounts } = useAccountsQuery()
  const { mutateAsync: removeTransactions } = useDeleteTransactions()
  const { mutateAsync: removeTransactionsBulk, isPending: bulkDeleting } = useDeleteTransactionsBulk()

  const loading = transactionsLoading
  const refreshing = transactionsRefetching
  const error = transactionsError

  const loadData = () => {
    refetchTransactions()
    refetchAccounts()
  }

  const listItems = useMemo(
    () => mergeTransferLegs(transactions, accounts),
    [transactions, accounts]
  )

  const { getCategory } = useCategories()

  const filterTransactions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter((tx) => {
      const category = getCategory(
        tx.category,
        tx.type === "INCOME" || tx.type === "TRANSFER_IN" ? "INCOME" : "EXPENSE"
      )
      return (
        tx.description?.toLocaleLowerCase().includes(q) ||
        (!category.isCustom && tx.category.toLowerCase().includes(q)) ||
        category.label.toLowerCase().includes(q) ||
        tx.transfer?.fromName.toLowerCase().includes(q) ||
        tx.transfer?.toName.toLowerCase().includes(q)
      )
    })
  }, [listItems, search, t, getCategory])

  const chart = useMemo(() => buildChartBuckets(dateRange), [dateRange, i18n.language])

  const dailyIncomeExpense = useMemo(() => {
    const income = new Map<string, number>()
    const expense = new Map<string, number>()

    for (const tx of transactions) {
      const key = chart.keyof(new Date(tx.date))
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
    setSelectedIds(new Set())
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const { count } = await exportTransactionsToCsv(transactions, {
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
            }
          }
        ]
      )
    },
    [removeTransactions, t]
  )


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
        : t("transactions.deleteSelectedOne", { count: selected.length })
      ) +
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
        <TransactionsHeader
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          bulkDeleting={bulkDeleting}
          exporting={exporting}
          onDeleteSelected={handleDeleteSelected}
          onExitSelection={exitSelectionMode}
          onEnterSelection={() => setSelectionMode(true)}
          onExport={handleExport}
        />

        <TransactionSearchBar value={search} onChangeText={setSearch} />

        <TransactionTypeFilter activeFilter={activeFilters} onChange={setActiveFilters} />

        <AccountFilterChips
          accounts={accounts}
          activeAccountId={activeAccountId}
          onChange={setActiveAccountId}
        />

        <DateRangeFilterButton
          dateRange={dateRange}
          rangeActive={rangeActive}
          onOpen={() => setRangeSheetOpen(true)}
          onReset={() => handleApplyRange(ALL_TIME)}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A9EFF" />
        </View>
      ) : error ? (
        <TransactionsErrorState onRetry={loadData} />
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
              <TransactionChart data={dailyIncomeExpense} />
            ) : null
          }
          ListEmptyComponent={
            <TransactionsEmptyState hasSearch={search.length > 0} rangeActive={rangeActive} />
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