import i18n from "@/lib/i18n"
import { format } from "date-fns"
import { enUS, id } from "date-fns/locale"

export function getDateLocale() {
  return i18n.language === "id" ? id : enUS
}

export function formatDate(date: Date | number, pattern: string) {
    return format(date, pattern, {locale: getDateLocale()})
}