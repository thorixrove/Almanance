import { parseAmount } from "@/lib/utils"
import {z} from "zod"

export const onboardingSchema = z.object({
    startingBalance: z
    .string()
    .min(1, "Please enter a satarting balance.")
    .refine((v) => {
        const parsed = parseAmount(v)
        return Number.isFinite(parsed) && parsed > 0
    }, "Please enter a valid balance."),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>