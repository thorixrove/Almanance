import { queryClient } from "@/lib/query/client";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
console.log('KEY:', publishableKey)

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function AuthedFetchTest() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/user?select=clerk_id&limit=1`, {
          headers: {
            apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY!,
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('AUTHED_TEST_STATUS:', res.status);
        const text = await res.text();
        console.log('AUTHED_TEST_BODY:', text);
      } catch (e: any) {
        console.log('AUTHED_TEST_ERROR:', e.message);
      }
    })();
  }, [isSignedIn]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <AuthedFetchTest />
          <Slot />
        </ClerkProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}