import { parseAmount } from "@/lib/utils"
import {z} from "zod"

export const onboardingSchema = z.object({
    startingBalance: z
    .string()
    .min(1, "onboarding.balanceRequired")
    .refine((v) => {
        const parsed = parseAmount(v)
        return Number.isFinite(parsed) && parsed > 0
    }, "onboarding.balanceInvalid"),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>