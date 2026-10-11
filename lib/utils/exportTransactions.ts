import { Transaction } from "@/lib/services/transactions"
import { Directory, File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { format } from "date-fns"


const EXPORT_WINDOW_DAYS = 30

function toCsvCell(value: string | number | null) {
    if (value === null) return ""
    const str = String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str
}

function buildCsv(transactions: Transaction[]) {
    const header = [
        "Date",
        "Type",
        "Category",
        "Description",
        "Amount",
        "Input Method",
    ]
    const rows = transactions.map((tx) => [
        format(new Date(tx.date), "yyyy-MM-dd"),
        tx.type,
        tx.category,
        tx.description ?? "",
        tx.amount,
        tx.input_method,
    ])

    return [header, ...rows]
        .map((row) => row.map(toCsvCell).join(","))
        .join("\n")
}

// applyWindow = true  -> hanya 30 hari terakhir (perilaku lama, saat tanpa filter tanggal).
// applyWindow = false -> ekspor semua yang diberikan (saat user sudah memilih rentang tanggal).
export async function exportTransactionsToCsv(
    transactions: Transaction[],
    options: { applyWindow?: boolean } = {}
) {
    const { applyWindow = true } = options
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - EXPORT_WINDOW_DAYS)

    const recentTransactions = applyWindow
        ? transactions.filter((tx) => new Date(tx.date) >= cutoff)
        : transactions

    const csv = buildCsv(recentTransactions)
    const fileName = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
    const file = new File(new Directory(Paths.cache), fileName)
    if (file.exists) file.delete()
    file.create()
    file.write(csv)

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            dialogTitle: "Export transactions",
            UTI: "public.comma-separated-values-text",
        })
    }

    return { count: recentTransactions.length, uri: file.uri }
}