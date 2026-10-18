import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getGoals } from "@/lib/services/goals";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useGoalsQuery() {
    const { user } = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: queryKeys.goals(user?.id),
        queryFn: () => getGoals(supabase),
        enabled: !!user,
    })
}