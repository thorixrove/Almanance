import {z} from "zod"

const emailField = z
.string()
.trim()
.min(1, "auth.emailRequired")
.pipe(z.email("auth.emailInvalid"))

export const signInSchema = z.object({
    email: emailField
})

export type SignInFormValues = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
    firstName: z.string().trim().min(1, "auth.firstNameRequired"),
    lastName: z.string().trim().min(1, "auth.lastNameRequired"),
    email: emailField
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const codeSchema = z.object({
    code: z
    .string()
    .trim()
    .min(1, "auth.codeRequired")
    .regex(/^\d{6}$/, "auth.codeInvalid"),
})

export type CodeFormValue = z.infer<typeof codeSchema>