import { TouchableOpacity, Text, Alert } from 'react-native'
import { useAuth, useUser } from '@clerk/expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function profileScreen() {
  const {user} = useUser()
  const {signOut} = useAuth()
  const router = useRouter()

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

    return (
      <SafeAreaView className='flex-1 bg-brand-body' edges={["top"]}>
        <TouchableOpacity>
          <Text onPress={handleSignOut}>Log out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )


}