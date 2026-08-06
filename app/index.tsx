import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { Text, SafeAreaView } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded} = useAuth()

  if (!isLoaded) {
    return null
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />
  }

  return  <Redirect href="/sign-in"/>
}
