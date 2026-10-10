import { CategoryKey, getCategoryConfig } from "@/constants/categories";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget } from "./budgets";
import type { Transaction } from "./transactions";
import { formatPrice } from "../utils";
import {
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

// Pemanggilan Groq dilakukan di Supabase Edge Function "assistant-chat".
// API key Groq hanya ada di server (secret GROQ_API_KEY), tidak ada di aplikasi.
const FUNCTION_NAME = "assistant-chat";

// Transaksi saldo awal dari onboarding bukan pemasukan sungguhan.
const STARTING_BALANCE_DESCRIPTION = "Starting balance";

// Batas panjang deskripsi per baris supaya konteks tidak membengkak.
const MAX_DESCRIPTION_LENGTH = 60;

// Jumlah baris transaksi (bulan lalu sampai sekarang) yang dikirim sebagai konteks.
const MAX_TRANSACTION_LINES = 60;

// Server menolak konteks di atas 16000 karakter, jadi dipotong di sini lebih dulu.
const MAX_CONTEXT_CHARS = 15000;

// Server hanya memakai 10 pesan terakhir dari riwayat.
const MAX_HISTORY_MESSAGES = 10;

export type AssistantHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type Totals = {
  income: number;
  expense: number;
  byCategory: Record<string, number>;
};

function summarize(transactions: Transaction[]): Totals {
  const totals: Totals = { income: 0, expense: 0, byCategory: {} };

  transactions.forEach((tx) => {
    if (tx.type === "EXPENSE") {
      totals.expense += tx.amount;
      totals.byCategory[tx.category] =
        (totals.byCategory[tx.category] ?? 0) + tx.amount;
    } else if (tx.description !== STARTING_BALANCE_DESCRIPTION) {
      totals.income += tx.amount;
    }
  });

  return totals;
}

function formatSummary(title: string, totals: Totals, currency: string) {
  const categoryLines = Object.entries(totals.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) =>
        `- ${getCategoryConfig(category as CategoryKey).label}: ${formatPrice(
          amount,
          currency
        )}`
    )
    .join("\n");

  return `${title}:
Total income: ${formatPrice(totals.income, currency)}
Total expense: ${formatPrice(totals.expense, currency)}
Expense by category:
${categoryLines || "No expenses recorded."}`;
}

function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string
) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(lastMonthStart);

  const last30 = transactions.filter(
    (tx) => new Date(tx.date) >= subDays(now, 30)
  );
  const thisMonth = transactions.filter(
    (tx) => new Date(tx.date) >= thisMonthStart
  );
  const lastMonth = transactions.filter((tx) => {
    const date = new Date(tx.date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });

  const thisMonthTotals = summarize(thisMonth);

  const budgetLine = budget
    ? `${formatPrice(thisMonthTotals.expense, currency)} spent of ${formatPrice(
        budget.amount,
        currency
      )} monthly budget`
    : "No monthly budget set";

  // Transaksi dari awal bulan lalu sampai sekarang (data sudah urut terbaru dulu).
  const txLines = transactions
    .filter((tx) => new Date(tx.date) >= lastMonthStart)
    .slice(0, MAX_TRANSACTION_LINES)
    .map((tx) => {
      const description = tx.description
        ? ` | ${tx.description.slice(0, MAX_DESCRIPTION_LENGTH)}`
        : "";
      return `- ${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${
        getCategoryConfig(tx.category).label
      } | ${formatPrice(tx.amount, currency)}${description}`;
    })
    .join("\n");

  const context = `Today: ${format(now, "d MMM yyyy")}

${formatSummary(
  `This month so far (${format(now, "MMMM yyyy")})`,
  thisMonthTotals,
  currency
)}

${formatSummary(
  `Last month (${format(lastMonthStart, "MMMM yyyy")})`,
  summarize(lastMonth),
  currency
)}

${formatSummary("Last 30 days", summarize(last30), currency)}

Monthly budget:
${budgetLine}

Transactions since the start of last month (newest first):
${txLines || "No transactions recorded."}`;

  return context.slice(0, MAX_CONTEXT_CHARS);
}

export async function askAssistant(
  supabase: SupabaseClient,
  question: string,
  transactions: Transaction[],
  budget: Budget | null,
  currency: string,
  // Pesan sebelumnya, TANPA pertanyaan yang sedang diajukan.
  history: AssistantHistoryItem[] = []
) {
  const context = buildContext(transactions, budget, currency);

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      question,
      context,
      history: history.slice(-MAX_HISTORY_MESSAGES),
    },
  });

  if (error) {
    // Ambil pesan dari response function bila ada (mis. "Unauthorized").
    let detail = error.message;
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === "function") {
      try {
        const body = await response.json();
        if (body?.error) detail = body.error;
      } catch {
        // abaikan, pakai pesan bawaan
      }
    }
    throw new Error(detail);
  }

  const reply = data?.reply;
  if (typeof reply !== "string" || !reply) {
    throw new Error("Empty response from assistant function");
  }
  return reply;
}