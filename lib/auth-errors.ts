import type { TFunction } from "i18next"

type AuthError = { code?: string; message: string; longMessage?: string }

const RATE_LIMIT_CODES = ["too_many_requests", "rate_limit_exceeded"]

export function isRateLimitError(error: AuthError): boolean {
    return (
        (error.code !== undefined && RATE_LIMIT_CODES.includes(error.code)) ||
        /too many/i.test(error.message)
    )
}

export function getAuthErrorMessage(error: AuthError, t: TFunction): string {
    if (isRateLimitError(error)) return t("auth.toManyRequests")
        return error.longMessage ?? error.message 
}