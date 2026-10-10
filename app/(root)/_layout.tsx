import { useAuth } from '@clerk/expo'
import { Redirect, Slot, usePathname} from 'expo-router'
import { useUserStore } from '@/store/useStore'
import { useEffect, useState } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { ActivityIndicator, AppState, View } from 'react-native'
import { LockScreen } from '@/components/LockScreen'



export default function RootGroupLayout() {
    const { isSignedIn, isLoaded} = useAuth()
    const needsOnboarding = useUserStore((state) => state.needsOnboarding)
    const biometricEnabled = useUserStore((state) => state.biometricEnabled)
    const isLocked = useUserStore((state) => state.isLocked)
    const hydrateBiometric = useUserStore((state) => state.hydrateBiometric)
    const lock = useUserStore((state) => state.lock)
    const pathname = usePathname();
    const [minLoadDone, setMinLoadDone] = useState(false);

    useUserSync()

    useEffect(() => {
      hydrateBiometric()
    }, [hydrateBiometric])


    useEffect(() => {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'background') lock()
      })
    return () => sub.remove()
    }, [lock])

    useEffect(() => {
      const t = setTimeout(() => setMinLoadDone(true), 1500)
      return () => clearTimeout(t)
    }, [])


  if(!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/sign-in"/>
  if (!minLoadDone || needsOnboarding === null || biometricEnabled === null) return (
    <View className='flex-1 bg-brand-body items-center justify-center'>
      <ActivityIndicator size="large" color="#1A1D26"/>
    </View>
  )
  if (needsOnboarding && pathname !== "/onboarding") return <Redirect href="/(root)/onboarding"/>

  return (
    <View className='flex-1'>
      <Slot/>
      {isLocked && <LockScreen/>}
    </View>
  )
}