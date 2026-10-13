import { BottomSheet } from "@/components/BottomSheet"
import { PillGroup } from "@/components/PillGroup"
import {
    DateRange,
    DateRangePreset,
    getCustomRange,
    getPresetRange,
    PRESET_OPTIONS,
} from "@/lib/utils/dateRange"
import "dayjs/locale/id"
import { formatDate } from "@/lib/i18n/dateLocale"
import { useTranslation } from "react-i18next"
import { useThemeColors, useThemeScheme } from "@/components/ThemeProvider"
import { useEffect, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker"

export function DateRangeSheet({
    visible,
    value,
    onClose,
    onApply,
}: {
    visible: boolean
    value: DateRange
    onClose: () => void
    onApply: (range: DateRange) => void
}) {
    const { t, i18n } = useTranslation()
    const scheme = useThemeScheme()
    const colors = useThemeColors()
    const defaultStyles = useDefaultStyles(scheme)
    const presetOptions = PRESET_OPTIONS.map((o) => ({
        key: o.key,
        label: t(o.labelKey),
    }))
    const [showCustom, setShowCustom] = useState(false)
    const [start, setStart] = useState<Date | null>(null)
    const [end, setEnd] = useState<Date | null>(null)

    useEffect(() => {
        if (!visible) return
        setShowCustom(value.preset === "CUSTOM")
        setStart(value.preset === "CUSTOM" ? value.from : null)
        setEnd(value.preset === "CUSTOM" ? value.to : null)
    }, [visible, value])

    const handlePreset = (preset: DateRangePreset) => {
        if (preset === "CUSTOM") {
            setShowCustom(true)
            return
        }
        onApply(getPresetRange(preset))
        onClose()
    }

    const handleApplyCustom = () => {
        if (!start) return
        onApply(getCustomRange(start, end ?? start))
        onClose()
    }

    const footer = showCustom ? (
        <TouchableOpacity
            onPress={handleApplyCustom}
            disabled={!start}
            className={`rounded-xl py-4 items-center ${start ? "bg-brand-bg" : "bg-[#D5D2C8]"
                }`}
            activeOpacity={0.85}
        >
            <Text className="text-white text-sm font-semibold">{t("dateRange.apply")}</Text>
        </TouchableOpacity>
    ) : undefined

    return (
        <BottomSheet
            visible={visible}
            title={t("dateRange.title")}
            onClose={onClose}
            footer={footer}
        >
            <PillGroup options={presetOptions}
                value={showCustom ? "CUSTOM" : value.preset}
                onChange={handlePreset} />
            {showCustom && (
                <View className="mt-4">
                    <Text className="text-brand-text-secondary text-xs mb-2">
                        {start
                            ? `${formatDate(start, "d MMM yyyy")} – ${end ? formatDate(end, "d MMM yyyy") : t("dateRange.pickEnd")
                            }`
                            : t("dateRange.pickStart")
                        }
                    </Text>
                    <View className="bg-white border border-[#E8E6DF] rounded-xl mb-4 overflow-hidden">
                        <DateTimePicker
                            mode="range"
                            startDate={start}
                            endDate={end}
                            maxDate={new Date()}
                            firstDayOfWeek={1}
                            locale={i18n.language}
                            allowRangeReset
                            onChange={({ startDate, endDate }) => {
                                setStart(startDate ? new Date(startDate as string | number | Date) : null)
                                setEnd(endDate ? new Date(endDate as string | number | Date) : null)
                            }}
                            styles={{
                                ...defaultStyles,
                                today: { borderWidth: 1, borderColor: colors.ink },
                            }}
                        />
                    </View>
                </View>
            )}
        </BottomSheet>
    )
}