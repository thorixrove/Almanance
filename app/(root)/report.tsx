import { getCategoryConfig, getCategoryLabel } from "@/constants/categories"
import i18n from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/dateLocale"
import { useMonthlyReportQuery } from "@/hooks/queries/useMonthlyReportQuery"
import { formatPrice } from "@/lib/utils"
import { useUserStore } from "@/store/useStore"
import type { CategoryComparison, ReportDelta } from "@/types"
import { Feather } from "@expo/vector-icons"
import {
  addMonths,
  differenceInCalendarMonths,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns"
import { useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import { useThemeColors } from "@/components/ThemeProvider"
import { useCallback, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  if (delta.diff === 0) return i18n.t("report.noChange")
  if (delta.percent === null) return i18n.t("report.new")
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
  const { t } = useTranslation()
  const config = getCategoryConfig(item.category)
  const barWidth =
    item.current > 0 ? `${Math.max((item.current / maxValue) * 100, 2)}%` : "0%"

  return (
    <View className={`py-3 ${isLast ? "" : "border-b border-line-soft"}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-base">{config.icon}</Text>
          <Text className="text-ink text-[13px] font-medium" numberOfLines={1}>
            {getCategoryLabel(item.category)}
          </Text>
        </View>
        <DeltaBadge delta={item} />
      </View>

      <View className="h-1.5 rounded-full bg-line-soft overflow-hidden mb-2">
        <View
          className="h-1.5 rounded-full bg-brand-blue"
          style={{ width: barWidth as any }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-ink text-xs font-medium">
          {formatPrice(item.current, currency)}
        </Text>
        <Text className="text-brand-text-secondary text-xs">
          {t("report.lastMonthAmount", { amount: formatPrice(item.previous, currency) })}
        </Text>
      </View>
    </View>
  )
}

const MONTHS_BACK = 59 // jangkauan geser: 5 tahun ke belakang sampai bulan ini

/** Satu halaman laporan untuk satu bulan. */
function MonthPage({
  month,
  width,
  currency,
}: {
  month: Date
  width: number
  currency: string
}) {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const { report, isLoading, isError, isRefetching, refetch } =
    useMonthlyReportQuery(month)

  const isCurrentMonth = isSameMonth(month, new Date())
  const previousMonth = subMonths(month, 1)
  const maxValue = Math.max(1, ...report.categories.map((c) => c.current))

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : isError ? (
        <View className="py-16 items-center">
          <Text className="text-brand-text-secondary text-sm mb-3">
            {t("report.loadError")}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-solid rounded-xl px-5 py-3"
          >
            <Text className="text-on-solid text-sm font-semibold">{t("report.tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Total */}
          <View className="bg-hero rounded-[20px] p-5 mt-2 mb-4">
            <Text className="text-brand-text-secondary text-xs mb-1.5">
              {t("report.totalSpending")}
            </Text>
            <Text className="text-brand-text-primary text-[32px] font-medium tracking-tight">
              {formatPrice(report.total.current, currency)}
            </Text>
            <View className="flex-row items-center gap-2 mt-3">
              <DeltaBadge delta={report.total} />
              <Text className="text-brand-text-secondary text-xs flex-1">
                {t("report.versus", {
                  amount: formatPrice(report.total.previous, currency),
                  month: formatDate(previousMonth, "MMM yyyy"),
                })}
              </Text>
            </View>
            {isCurrentMonth && (
              <Text className="text-brand-text-secondary text-[11px] mt-3">
                {t("report.inProgress")}
              </Text>
            )}
          </View>

          {/* Per kategori */}
          <View className="bg-card rounded-[18px] border border-line px-4 pt-4 pb-1">
            <Text className="text-ink text-sm font-medium">
              {t("report.byCategory")}
            </Text>

            {report.categories.length === 0 ? (
              <Text className="text-brand-text-secondary text-xs py-6 text-center">
                {t("report.noExpenses")}
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
    </ScrollView>
  )
}

/** Pemilih bulan: ganti tahun lalu pilih bulan, bisa lompat ke bulan mana pun. */
function MonthPickerModal({
  visible,
  selected,
  minMonth,
  maxMonth,
  onSelect,
  onClose,
}: {
  visible: boolean
  selected: Date
  minMonth: Date
  maxMonth: Date
  onSelect: (month: Date) => void
  onClose: () => void
}) {
  useTranslation()
  const colors = useThemeColors()
  const [year, setYear] = useState(selected.getFullYear())
  const minYear = minMonth.getFullYear()
  const maxYear = maxMonth.getFullYear()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setYear(selected.getFullYear())}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onPress={onClose}
      >
        {/* Pressable kosong agar tap di dalam kartu tidak menutup modal */}
        <Pressable className="bg-card rounded-[20px] p-5" onPress={() => {}}>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => setYear((y) => y - 1)}
              disabled={year <= minYear}
              hitSlop={8}
              className="w-9 h-9 rounded-full border border-line items-center justify-center"
              style={{ opacity: year <= minYear ? 0.35 : 1 }}
            >
              <Feather name="chevron-left" size={18} color={colors.ink} />
            </TouchableOpacity>
            <Text className="text-ink text-base font-medium">{year}</Text>
            <TouchableOpacity
              onPress={() => setYear((y) => y + 1)}
              disabled={year >= maxYear}
              hitSlop={8}
              className="w-9 h-9 rounded-full border border-line items-center justify-center"
              style={{ opacity: year >= maxYear ? 0.35 : 1 }}
            >
              <Feather name="chevron-right" size={18} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap">
            {Array.from({ length: 12 }, (_, m) => {
              const date = new Date(year, m, 1)
              const disabled = date < minMonth || date > maxMonth
              const active = isSameMonth(date, selected)
              return (
                <View key={m} className="w-1/3 p-1">
                  <TouchableOpacity
                    disabled={disabled}
                    onPress={() => onSelect(date)}
                    className={`py-3 rounded-xl items-center border ${
                      active
                        ? "bg-solid border-solid"
                        : "bg-card border-line"
                    }`}
                    style={{ opacity: disabled ? 0.3 : 1 }}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active ? "text-on-solid" : "text-ink"
                      }`}
                    >
                      {formatDate(date, "MMM")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function ReportScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const colors = useThemeColors()
  const currency = useUserStore((s) => s.currency)
  const { width } = useWindowDimensions()

  const maxMonth = useMemo(() => startOfMonth(new Date()), [])
  const minMonth = useMemo(
    () => subMonths(maxMonth, MONTHS_BACK),
    [maxMonth]
  )
  // urut dari terlama (kiri) ke terbaru (kanan)
  const months = useMemo(
    () => Array.from({ length: MONTHS_BACK + 1 }, (_, i) => addMonths(minMonth, i)),
    [minMonth]
  )

  const lastIndex = months.length - 1
  const [index, setIndex] = useState(lastIndex)
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<FlatList<Date>>(null)

  const month = months[index]
  const canGoBack = index > 0
  const canGoForward = index < lastIndex

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width)
      setIndex(Math.min(Math.max(next, 0), lastIndex))
    },
    [width, lastIndex]
  )

  const jumpTo = (target: Date) => {
    const next = Math.min(
      Math.max(differenceInCalendarMonths(target, minMonth), 0),
      lastIndex
    )
    setPickerOpen(false)
    setIndex(next)
    listRef.current?.scrollToIndex({ index: next, animated: false })
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
        <Text className="text-ink text-lg font-medium">{t("home.monthlyReport")}</Text>
      </View>

      {/* Bulan terpilih: tap untuk lompat ke bulan mana pun */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setPickerOpen(true)}
        className="mx-5 bg-card rounded-xl border border-line py-3 px-4 flex-row items-center justify-between"
      >
        {/* Panah di tepi = penanda halaman bisa digeser */}
        <Feather
          name="chevron-left"
          size={16}
          color="#8A8D96"
          style={{ opacity: canGoBack ? 1 : 0.2 }}
        />
        <View className="flex-row items-center gap-1.5">
          <Text className="text-ink text-sm font-medium">
            {formatDate(month, "MMMM yyyy")}
          </Text>
          <Feather name="chevron-down" size={14} color="#8A8D96" />
        </View>
        <Feather
          name="chevron-right"
          size={16}
          color="#8A8D96"
          style={{ opacity: canGoForward ? 1 : 0.2 }}
        />
      </TouchableOpacity>
      <Text className="text-brand-text-secondary text-[11px] text-center mt-1.5">
        {t("report.swipeHint")}
      </Text>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={months}
        keyExtractor={(m) => m.toISOString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={lastIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onMomentumEnd}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews
        renderItem={({ item }) => (
          <MonthPage month={item} width={width} currency={currency} />
        )}
      />

      <MonthPickerModal
        visible={pickerOpen}
        selected={month}
        minMonth={minMonth}
        maxMonth={maxMonth}
        onSelect={jumpTo}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  )
}