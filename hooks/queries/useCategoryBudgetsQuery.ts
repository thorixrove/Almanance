import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getCategoryBudgets } from "@/lib/services/categoryBudgets";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useCategoryBudgetsQuery() {
    const {user} = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: queryKeys.categoryBudgets(user?.id),
        queryFn: () => getCategoryBudgets(supabase),
        enabled: !!user,
    })
}