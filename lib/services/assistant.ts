import { CategoryKey, getCategoryConfig } from "@/constants/categories";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget } from "./budgets";
import type { Transaction } from "./transactions";
import { formatPrice } from "../utils";
import { format, isSameMonth, subDays } from "date-fns";

// Pemanggilan Groq dilakukan di Supabase Edge Function "assistant-chat".
// API key Groq hanya ada di server (secret GROQ_API_KEY), tidak ada di aplikasi.
const FUNCTION_NAME = "assistant-chat";

// Transaksi saldo awal dari onboarding bukan pemasukan sungguhan.
const STARTING_BALANCE_DESCRIPTION = "Starting balance";

// Batas panjang deskripsi per baris supaya konteks tidak membengkak.
const MAX_DESCRIPTION_LENGTH = 60;

function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string
) {
  const now = new Date();
  const cutoff = subDays(now, 30);
  const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff);

  const thisMonthExpense = transactions
    .filter((tx) => tx.type === "EXPENSE" && isSameMonth(new Date(tx.date), now))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const spentByCategory: Record<string, number> = {};
  let income = 0;
  let expense = 0;

  recent.forEach((tx) => {
    if (tx.type === "EXPENSE") {
      expense += tx.amount;
      spentByCategory[tx.category] =
        (spentByCategory[tx.category] ?? 0) + tx.amount;
    } else if (tx.description !== STARTING_BALANCE_DESCRIPTION) {
      income += tx.amount;
    }
  });

  const categoryLines = Object.entries(spentByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, amount]) =>
        `- ${getCategoryConfig(category as CategoryKey).label}: ${formatPrice(
          amount,
          currency
        )}`
    )
    .join("\n");

  const budgetLine = budget
    ? `${formatPrice(thisMonthExpense, currency)} spent of ${formatPrice(
        budget.amount,
        currency
      )} monthly budget`
    : "No monthly budget set";

  const txLines = recent
    .slice(0, 40)
    .map((tx) => {
      const description = tx.description
        ? ` | ${tx.description.slice(0, MAX_DESCRIPTION_LENGTH)}`
        : "";
      return `- ${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${
        getCategoryConfig(tx.category).label
      } | ${formatPrice(tx.amount, currency)}${description}`;
    })
    .join("\n");

  return `Last 30 days summary:
Total income: ${formatPrice(income, currency)}
Total expense: ${formatPrice(expense, currency)}

Spending by category:
${categoryLines || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions:
${txLines || "No transactions recorded."}`;
}

export async function askAssistant(
  supabase: SupabaseClient,
  question: string,
  transactions: Transaction[],
  budget: Budget | null,
  currency: string
) {
  const context = buildContext(transactions, budget, currency);

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { question, context },
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