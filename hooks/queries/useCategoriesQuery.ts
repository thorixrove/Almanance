import { useSupabase } from "@/hooks/useSupabase";
import { queryKeys } from "@/lib/query/keys";
import { getCustomCategories } from "@/lib/services/categories";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export function useCategoriesQuery() {
    const {user} = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: queryKeys.categories(user?.id),
        queryFn: () => getCustomCategories(supabase, user!.id),
        enabled: !!user,
    })
}