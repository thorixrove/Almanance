import DateTimePicker, {useDefaultStyles} from "react-native-ui-datepicker"
import { useThemeColors, useThemeScheme } from "@/components/ThemeProvider"

export function CalendarPicker({
    value,
    onChange,
    maximumDate,
} : {
    value: Date
    onChange: (date: Date) => void
    maximumDate?: Date
}) {
    const scheme = useThemeScheme()
    const colors = useThemeColors()
    const defaultStyles = useDefaultStyles(scheme)

    return (
        <DateTimePicker
        mode="single"
        date={value}
        maxDate={maximumDate}
        onChange={({ date }) => 
        date && onChange(new Date(date as string | number | Date))}
    
        styles={{
            ...defaultStyles,
            today: { borderWidth: 1, borderColor: colors.ink },
        }}
        />
    )
}