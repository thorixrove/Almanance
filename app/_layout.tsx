import { queryClient } from "@/lib/query/client";
import { ClerkProvider } from "@clerk/expo";
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

export default function RootLayout() {
  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY! }
    })
      .then((res) => console.log('SUPABASE_TEST_STATUS:', res.status))
      .catch((err) => console.log('SUPABASE_TEST_ERROR:', err.message));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <Slot />
        </ClerkProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}