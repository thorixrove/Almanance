import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function onboarding() {
  return (
    <SafeAreaView className='flex-1 bg-brand-body' edges={["top"]}>
        <Text>OnBoardingScreen</Text>
    </SafeAreaView>
  )
}