import { createClient} from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to your .env file."
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createClerkSupabaseClient(
    getToken: () => Promise<string | null>
) {
    return createClient(supabaseUrl, supabaseAnonKey , {
        async accessToken() {
            return getToken()
        }
    })
}