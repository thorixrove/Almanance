import { BudgetModal } from "@/components/BudgetModal";
import { TransactionRow } from "@/components/TransactionRow";
import { TransferSheet } from "@/components/TransferSheet";
import { mergeTransferLegs } from "@/lib/utils/transfer";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery"
import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery"
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery"
import { Transaction } from "@/types"
import { formatPrice } from "@/lib/utils"
import { useUserStore } from "@/store/useStore"
import { useUser } from "@clerk/expo"
import { Feather } from "@expo/vector-icons"
import { isSameMonth } from "date-fns"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useThemeColors } from "@/components/ThemeProvider"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts"
import { SafeAreaView } from "react-native-safe-area-context"
import { useCategories } from "@/hooks/useCategories"
import { HomeGoalsCard } from "@/components/HomeGoalsCard";



// Transaksi saldo awal dari onboarding bukan pemasukan sungguhan,
// jadi tidak ikut dihitung di ringkasan pemasukan bulan ini.
const STARTING_BALANCE_DESCRIPTION = "Starting balance"

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour < 12) return "home.greetingMorning"
  if (hour < 18) return "home.greetingAfternoon"
  return "home.greetingEvening"
}

const QUICK_ACTIONS = [
  {
    icon: "camera",
    labelKey: "home.quickScan",
    action: "scan",
    color: "#1A85FF",
  },
  {
    icon: "mic",
    labelKey: "home.quickVoice",
    action: "voice",
    color: "#FF6B4A",
  },
  {
    icon: "plus",
    labelKey: "home.quickManual",
    action: "manual",
    color: "#3DDC84",
  },
  {
    icon: "repeat",
    labelKey: "home.quickTransfer",
    action: "transfer",
    color: "#A29BFE",
  },
] as const;


export default function HomeScreen() {
  const { user } = useUser()
  const { t } = useTranslation()
  const colors = useThemeColors()
  const router = useRouter()
  const currency = useUserStore((s) => s.currency)

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountRefetching,
    refetch: refetchAccounts,
  } = useAccountsQuery()

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery()
  const { data: budgets = null, refetch: refetchBudget } = useBudgetQuery()

  const loading = accountsLoading || transactionsLoading
  const refreshing = accountRefetching || transactionsRefetching

  const onRefresh = () => {
    refetchAccounts()
    refetchTransactions()
    refetchBudget()
  }

  const totalBalance = useMemo(
    () => accounts.reduce((sum, accounts) => sum + accounts.balance, 0),
    [accounts]
  )

  const monthTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter((tx) => isSameMonth(new Date(tx.date), now))
  }, [transactions])

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter(
          (tx) =>
            tx.type === "INCOME" &&
            tx.description !== STARTING_BALANCE_DESCRIPTION
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  )

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions]
  )

  const recentTransactions = useMemo(
    () => mergeTransferLegs(transactions, accounts).slice(0, 5),
    [transactions, accounts]
  )

  const { getCategory } = useCategories()

  const expenseBreakedown = useMemo(() => {
    const map: Record<string, number> = {}
    monthTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount
      })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category: category as Transaction["category"],
        amount,
        color: getCategory(category as Transaction["category"], "EXPENSE").color,
      }))
  }, [monthTransactions, getCategory])

  return (
    <SafeAreaView className="flex-1 bg-hero" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-page"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dark hero header */}
        <View className="bg-hero rounded-b-[28px] px-5 pt-5 pb-[22px]">
          <View className="flex-row justify-between items-center mb-[22px]">
            <Image
              source={require("../../../assets/images/welth-light.png")}
              style={{ width: 80, height: "100%" }}
              contentFit="contain"
            />
            <View className="flex-row items-center gap-2.5">
              <View className="items-end">
                <Text className="text-brand-text-secondary text-xs">
                  {t(getGreetingKey())}
                </Text>
                <Text className="text-brand-text-primary text-base font-medium">
                  {user?.firstName ?? t("home.guestName")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/profile")}
                className="w-[38px] h-[38px] rounded-full bg-[#1A1D26] items-center justify-center overflow-hidden"
              >
                {user?.imageUrl && user.hasImage ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={{ width: 38, height: 38 }}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="user" size={18} color="#8A8D96" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-[22px]">
            <Text className="text-brand-text-secondary text-xs mb-1.5">
              {t("home.totalBalance")}
            </Text>
            <Text className="text-brand-text-primary text-[38px] font-medium tracking-tight">
              {formatPrice(totalBalance, currency)}
            </Text>
            <View className="flex-row gap-3.5 mt-2.5">
              <View className="flex-row items-center gap-1.5">
                <Feather name="arrow-up-right" size={14} color="#3DDC84" />
                <Text className="text-brand-success text-[13px]">
                  {formatPrice(monthIncome, currency)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Feather name="arrow-down-right" size={14} color="#FF6B4A" />
                <Text className="text-brand-coral text-[13px]">
                  {formatPrice(monthExpense, currency)}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.action}
                onPress={() =>
                  action.action === "transfer"
                    ? setTransferOpen(true)
                    : router.push({
                      pathname: "/(root)/(tabs)/add-transaction",
                      params: { action: action.action },
                    })
                }
                activeOpacity={0.75}
                className="flex-1 bg-brand-surface rounded-2xl border border-brand-surface-border py-4 items-center gap-2"
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${action.color}26` }}
                >
                  <Feather name={action.icon} size={17} color={action.color} />
                </View>
                <Text className="text-[#B8BAC2] text-[11px] font-medium text-center">
                  {t(action.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Light body */}
        <View className="px-5 pt-[18px] pb-5">
          <TouchableOpacity
            onPress={() => router.push("/(root)/(tabs)/assistant")}
            className="bg-card rounded-[18px] border border-line p-3.5 flex-row items-center gap-2.5 mb-[18px]"
          >
            <View className="w-[26px] h-[26px] rounded-full bg-[#4A9EFF1A] items-center justify-center">
              <View className="w-[7px] h-[7px] rounded-full bg-brand-blue" />
            </View>
            <Text className="text-subtle text-[13px] flex-1">
              {t("home.askAi")}
            </Text>
            <Feather name="arrow-right" size={16} color="#4A9EFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.85}
            className="bg-card rounded-[18px] border border-line p-4 mb-[18px]"
          >
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-ink text-sm font-medium">
                {t("home.monthlyBudget")}
              </Text>
              <Feather name="edit-2" size={13} color="#8A8D96" />
            </View>

            {budgets ? (
              <>
                <Text className="text-brand-text-secondary text-xs mb-2">
                  {t("home.budgetSpent", {
                    spent: formatPrice(monthExpense, currency),
                    total: formatPrice(budgets.amount, currency),
                  })}
                </Text>
                <View className="h-2 rounded-full bg-line-soft overflow-hidden">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        Math.round((monthExpense / budgets.amount) * 100),
                        100
                      )}%`,
                      backgroundColor:
                        monthExpense >= budgets.amount
                          ? "#FF6B4A"
                          : monthExpense >= budgets.amount * 0.8
                            ? "#F7DC6F"
                            : "#3DDC84",
                    }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-brand-text-secondary text-xs">
                {t("home.setBudgetHint")}
              </Text>
            )}
          </TouchableOpacity>




          {expenseBreakedown.length > 0 && (
            <View className="bg-card rounded-[18px] border border-line p-4 mb-[18px]">

              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="flex-1 text-ink text-sm font-medium mr-2"
                  numberOfLines={1}
                >
                  {t("home.expenseBreakdown")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(root)/report")}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.monthlyReport")}
                  activeOpacity={0.7}
                  hitSlop={8}
                  className="flex-row items-center gap-1.5 bg-[#4A9EFF1A] border border-[#4A9EFF55] rounded-full px-4 py-1.5"
                >
                  <Feather name="bar-chart-2" size={17} color="#4A9EFF" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center">
                <PieChart
                  data={expenseBreakedown.map((c) => ({
                    value: c.amount,
                    color: c.color,
                  }))}
                  radius={60}
                  innerRadius={38}
                  innerCircleColor={colors.card}
                />
                <View className="flex-1 ml-4 gap-1.5">
                  {expenseBreakedown.slice(0, 6).map((c) => (
                    <View
                      key={c.category}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-1.5">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <Text className="text-brand-text-secondary text-[11px]">
                          {getCategory(c.category, "EXPENSE").label}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <HomeGoalsCard />

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-ink text-sm font-medium">
              {t("home.recentTransactions")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/transactions")}
            >
              <Text className="text-brand-text-secondary text-xs">{t("home.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#4A9EFF" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View className="items-center py-6">
              <Feather name="inbox" size={28} color={colors.subtle} />
              <Text className="text-subtle text-sm mt-3">
                {t("home.noTransactions")}
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </View>
      </ScrollView>

      {user && (
        <BudgetModal
          visible={budgetModalOpen}
          budget={budgets}
          onClose={() => setBudgetModalOpen(false)}
          onSaved={() => setBudgetModalOpen(false)}
        />
      )}

      {user && (
        <TransferSheet
          visible={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSaved={() => setTransferOpen(false)}
        />
      )}
    </SafeAreaView>
  )
}