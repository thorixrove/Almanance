import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getRecurringRules } from "@/lib/services/recurring";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useRecurringQuery() {
const {user} = useUser()
const supabase = useSupabase()

return useQuery({
    queryKey: queryKeys.recurring(user?.id),
    queryFn: () => getRecurringRules(supabase),
    enabled: !!user,
})
}