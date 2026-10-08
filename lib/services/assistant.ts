import { getCategoryConfig } from "@/constants/categories";
import type { Budget } from "./budgets"
import type { Transaction } from "./transactions";
import { formatPrice } from "../utils";
import { format, isSameMonth, subDays } from "date-fns";


const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

function buildContext(
    transactions: Transaction[],
    budgets: Budget | null,
    currency: string
) {
    const now = new Date()
    const cutoff = subDays(now, 30)
    const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff)
    const thisMontExpense = transactions
    .filter((tx) => tx.type === "EXPENSE" && isSameMonth(new Date(tx.date), now))
    .reduce((sum, tx) => sum + tx.amount, 0)

    const spentByCategory: Record<string, number> = {}
    let income = 0
    let expense = 0

    recent.forEach((tx) => {
        if (tx.type === "EXPENSE") {
            spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount
        } else {
            income += tx.amount
        }
    })

    const categoryLines = Object.entries(spentByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
        ([category, amount]) => 
            `- ${getCategoryConfig(category as any).label}: ${formatPrice(amount, currency)}`
    )
    .join("\n")

    const budgetLine = budgets
     ? `${formatPrice(thisMontExpense, currency)} spent of ${formatPrice(
        budgets.amount,
        currency
     )} monthly budgets` : "No monthly budget set"

     const txLines = recent
     .slice(0, 40)
     .map(
        (tx) => 
            `- ${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${
                getCategoryConfig(tx.category).label
            } | ${formatPrice(tx.amount, currency)}${
                tx.description ? ` | ${tx.description}` : ""
            }`
     )
     .join("\n")

     return `Last 30 days summary:
     Total income: ${formatPrice(income, currency)}
     Total expense: ${formatPrice(expense, currency)}

     Spending bg category
     ${categoryLines || "No expenses recorded."}

     Monthly budgets:
     ${budgetLine}

     Recent Transactions:
     ${txLines || "No transactions recorded."} `
    }

    export async function askAssistant(
        questions: string,
        transactions: Transaction[],
        budgets: Budget | null,
        currency: string
    ) {
        const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY
        if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY")

            const context = buildContext(transactions, budgets, currency)

            const prompt = `You are a helpful personal finance assistant inside the Welth app. Answer the user's question using only the financial data below. Be concise and specific with numbers. If the data doesn't answer the question, say so.

            ${context}

            User question: ${questions}`


            const res = await fetch(GROQ_CHAT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application.json",
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: prompt}]
                })
            })

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(`Groq request failed: ${errText}`);
            }

            const data = await res.json()
              const text = data?.choices?.[0]?.message?.content
              if (!text) throw new Error("No response feom Groq")
                return text as string
    }