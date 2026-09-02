import { createClerkSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/expo";
import { useMemo } from "react";

export function useSupabase() {
  const { getToken } = useAuth();

  const client = useMemo(
    () => createClerkSupabaseClient(async () => {
      try {
        const token = await getToken();
        console.log('CLERK_TOKEN_RESULT:', token ? 'GOT_TOKEN' : 'NULL_TOKEN');
        return token;
      } catch (e: any) {
        console.log('CLERK_TOKEN_ERROR:', e.message);
        throw e;
      }
    }),
    []
  );

  return client;
}