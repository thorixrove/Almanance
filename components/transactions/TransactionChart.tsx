import { useThemeColors } from "@/components/ThemeProvider"
import { useTranslation } from "react-i18next"
import { ScrollView, Text, View } from "react-native"
import { BarChart, barDataItem } from "react-native-gifted-charts"

type TransactionChartProps = {
    data: barDataItem[]
}

export function TransactionChart({ data }: TransactionChartProps) {
    const { t } = useTranslation()
    const colors = useThemeColors()

    return (
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
                    data={data}
                    width={Math.max(data.length * 9, 280)}
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
    )
}