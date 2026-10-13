import {z} from "zod"

export const signUpSchema = z.object({
    firstName: z.string().trim().min(1, "auth.firstNameRequired"),
    lastName: z.string().trim().min(1, "auth.lastNameRequired"),
    email: z.email("auth.emailInvalid").trim().min(1, "auth.emailRequired"),
    password: z.string().min(8, "auth.passwordMin"),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
    email: z.email("auth.emailInvalid").trim().min(1, "auth.emailRequired"),
    password: z.string().min(1, "auth.passwordRequired"),
})

export type SignInFormValues = z.infer<typeof signInSchema>

export const codeSchema = z.object({
    code: z.string().min(1, "auth.codeRequired"),
})

export type CodeFormValues = z.infer<typeof codeSchema>