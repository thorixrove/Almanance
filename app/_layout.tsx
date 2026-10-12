import "@/lib/i18n";
import { queryClient } from "@/lib/query/client";
import { useUserStore } from "@/store/useStore";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { useEffect, useState } from "react";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  const hydrateLanguage = useUserStore((state) => state.hydrateLanguage)
  const [languageReady, setLanguageReady] = useState(false)

  useEffect(() => {
    hydrateLanguage().finally(() => setLanguageReady(true))
  }, [hydrateLanguage])

  if (!languageReady) return null

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