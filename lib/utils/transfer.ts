import type { Account } from "@/types/account";
import type { StoredTransactionType, Transaction } from "@/types/transaction";

export function isTransferType(type: StoredTransactionType): boolean {
    return type === "TRANSFER_IN" || type === "TRANSFER_OUT";
}

export function isTransfer(tx: Pick<Transaction, "type">): boolean {
    return isTransferType(tx.type);
}

// Untuk perhitungan ringkasan, grafik, laporan, dan export:
// buang baris transfer supaya tidak dihitung sebagai pemasukan atau pengeluaran.
export function excludeTransfers<T extends Pick<Transaction, "type">>(txs: T[]): T[] {
    return txs.filter((tx) => !isTransfer(tx));
}

export type TransferDisplay = { fromName: string; toName: string };

type TransferTransaction = Transaction & {
    transfer_id?: string | null;
};

// Item untuk daftar di layar. `transfer` terisi kalau kedua sisi transfer
// digabung menjadi satu baris (mis. "Cash → Mandiri").
export type ListTransaction = Transaction & { transfer?: TransferDisplay };

// Satu transfer tersimpan sebagai dua baris (TRANSFER_OUT dan TRANSFER_IN).
// Untuk tampilan, keduanya digabung jadi satu item yang dibawa baris TRANSFER_OUT.
// Kalau hanya satu sisi ada di daftar (mis. difilter per akun), sisi itu tampil apa adanya.
// Jangan dipakai untuk perhitungan angka, hanya untuk daftar.
export function mergeTransferLegs(
    transactions: Transaction[],
    accounts: Pick<Account, "id" | "name">[]
): ListTransaction[] {
    const transferTransactions = transactions as TransferTransaction[]
    const names = new Map(accounts.map((a) => [a.id, a.name]))
    const nameOf = (id: string) => names.get(id) ?? "Unknown account"

    const outLegs = new Set<string>()
    const inLegs = new Map<string, TransferTransaction>()
    for (const tx of transferTransactions) {
        if (!tx.transfer_id) continue
        if (tx.type === "TRANSFER_OUT") outLegs.add(tx.transfer_id)
        else if (tx.type === "TRANSFER_IN") inLegs.set(tx.transfer_id, tx)
    }

    const result: ListTransaction[] = []
    for (const tx of transferTransactions) {
        const transferId = tx.transfer_id

        // Sisi masuk disembunyikan kalau sisi keluarnya ada di daftar.
        if (transferId && tx.type === "TRANSFER_IN" && outLegs.has(transferId)) continue

        if (transferId && tx.type === "TRANSFER_OUT") {
            const inLeg = inLegs.get(transferId)
            if (inLeg) {
                result.push({
                    ...tx,
                    transfer: {
                        fromName: nameOf(tx.account_id),
                        toName: nameOf(inLeg.account_id),
                    },
                })
                continue
            }
        }

        result.push(tx)
    }
    return result
}