import { CategoryKey } from "@/constants/categories";
import { parseAmount } from "@/lib/utils"
import {z} from "zod"

export const transactionSchema = z.object({
    type: z.enum(["EXPENSE", "INCOME"]),
    amount: z
    .string()
    .min(1, "Enter an amount.")
    .refine((v) => {
        const parsed = parseAmount(v)
        return Number.isFinite(parsed) && parsed > 0
    }, "Enter a valid amount."),
    category: z.custom<CategoryKey>((v) => typeof v === "string"),
    acccountId: z.string().min(1, "Select an account."),
    description: z.string().optional(),
    date: z.date(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>