import { getCategoryConfig } from "@/constants/categories"
import { useMonthlyReportQuery } from "@/hooks/queries/useMonthlyReportQuery"
import { formatPrice } from "@/lib/utils"
import { useUserStore } from "@/store/useStore"
import type { CategoryComparison, ReportDelta } from "@/types"
import { Feather } from "@expo/vector-icons"
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from "date-fns"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const UP_COLOR = "#FF6B4A" // pengeluaran naik = kabar buruk
const DOWN_COLOR = "#3DDC84" // pengeluaran turun = kabar baik
const NEUTRAL_COLOR = "#8A8D96"

function deltaColor(diff: number) {
  if (diff > 0) return UP_COLOR
  if (diff < 0) return DOWN_COLOR
  return NEUTRAL_COLOR
}

function deltaText(delta: ReportDelta) {
  if (delta.diff === 0) return "No change"
  if (delta.percent === null) return "New"
  const sign = delta.diff > 0 ? "+" : "-"
  return `${sign}${Math.abs(Math.round(delta.percent))}%`
}

function DeltaBadge({ delta }: { delta: ReportDelta }) {
  const color = deltaColor(delta.diff)
  return (
    <View
      className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}1F` }}
    >
      {delta.diff !== 0 && (
        <Feather
          name={delta.diff > 0 ? "arrow-up-right" : "arrow-down-right"}
          size={11}
          color={color}
        />
      )}
      <Text className="text-[11px] font-medium" style={{ color }}>
        {deltaText(delta)}
      </Text>
    </View>
  )
}

function CategoryRow({
  item,
  maxValue,
  currency,
  isLast,
}: {
  item: CategoryComparison
  maxValue: number
  currency: string
  isLast: boolean
}) {
  const config = getCategoryConfig(item.category)
  const barWidth =
    item.current > 0 ? `${Math.max((item.current / maxValue) * 100, 2)}%` : "0%"

  return (
    <View className={`py-3 ${isLast ? "" : "border-b border-[#F0EEE7]"}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-base">{config.icon}</Text>
          <Text className="text-brand-bg text-[13px] font-medium" numberOfLines={1}>
            {config.label}
          </Text>
        </View>
        <DeltaBadge delta={item} />
      </View>

      <View className="h-1.5 rounded-full bg-[#F0EEE7] overflow-hidden mb-2">
        <View
          className="h-1.5 rounded-full bg-brand-blue"
          style={{ width: barWidth as any }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-brand-bg text-xs font-medium">
          {formatPrice(item.current, currency)}
        </Text>
        <Text className="text-brand-text-secondary text-xs">
          {formatPrice(item.previous, currency)} last month
        </Text>
      </View>
    </View>
  )
}

export default function ReportScreen() {
  const router = useRouter()
  const currency = useUserStore((s) => s.currency)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const { report, isLoading, isError, isRefetching, refetch } =
    useMonthlyReportQuery(month)

  const isCurrentMonth = isSameMonth(month, new Date())
  const previousMonth = subMonths(month, 1)
  const maxValue = Math.max(1, ...report.categories.map((c) => c.current))

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-3 pb-3 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-white border border-[#E8E6DF] items-center justify-center"
        >
          <Feather name="arrow-left" size={18} color="#1A1D26" />
        </TouchableOpacity>
        <Text className="text-brand-bg text-lg font-medium">Monthly report</Text>
      </View>

      {/* Bulan terpilih */}
      <View className="mx-5 mb-1 bg-white rounded-xl border border-[#E8E6DF] py-3 items-center">
        <Text className="text-brand-bg text-sm font-medium">
          {format(month, "MMMM yyyy")}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#1A1D26" />
          </View>
        ) : isError ? (
          <View className="py-16 items-center">
            <Text className="text-brand-text-secondary text-sm mb-3">
              Couldn't load the report.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="bg-brand-bg rounded-xl px-5 py-3"
            >
              <Text className="text-white text-sm font-semibold">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Total */}
            <View className="bg-brand-bg rounded-[20px] p-5 mt-2 mb-4">
              <Text className="text-brand-text-secondary text-xs mb-1.5">
                Total spending
              </Text>
              <Text className="text-brand-text-primary text-[32px] font-medium tracking-tight">
                {formatPrice(report.total.current, currency)}
              </Text>
              <View className="flex-row items-center gap-2 mt-3">
                <DeltaBadge delta={report.total} />
                <Text className="text-brand-text-secondary text-xs flex-1">
                  vs {formatPrice(report.total.previous, currency)} in{" "}
                  {format(previousMonth, "MMM yyyy")}
                </Text>
              </View>
              {isCurrentMonth && (
                <Text className="text-brand-text-secondary text-[11px] mt-3">
                  This month is still in progress, compared with the full
                  previous month.
                </Text>
              )}
            </View>

            {/* Per kategori */}
            <View className="bg-white rounded-[18px] border border-[#E8E6DF] px-4 pt-4 pb-1">
              <Text className="text-brand-bg text-sm font-medium">
                By category
              </Text>

              {report.categories.length === 0 ? (
                <Text className="text-brand-text-secondary text-xs py-6 text-center">
                  No expenses in this period.
                </Text>
              ) : (
                report.categories.map((item, index) => (
                  <CategoryRow
                    key={item.category}
                    item={item}
                    maxValue={maxValue}
                    currency={currency}
                    isLast={index === report.categories.length - 1}
                  />
                ))
              )}
            </View>
          </>
        )}

        {/* Pindah bulan */}
        <View className="flex-row items-center justify-between mt-5">
          <TouchableOpacity
            onPress={() => setMonth((m) => subMonths(m, 1))}
            hitSlop={8}
            className="w-11 h-11 rounded-full bg-white border border-[#E8E6DF] items-center justify-center"
          >
            <Feather name="chevron-left" size={18} color="#1A1D26" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMonth((m) => addMonths(m, 1))}
            disabled={isCurrentMonth}
            hitSlop={8}
            className="w-11 h-11 rounded-full bg-white border border-[#E8E6DF] items-center justify-center"
            style={{ opacity: isCurrentMonth ? 0.35 : 1 }}
          >
            <Feather name="chevron-right" size={18} color="#1A1D26" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}