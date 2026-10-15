import { ALL_CURRENCIES, CurrencyPicker } from '@/components/CurrencyPicker'
import { useSupabase } from '@/hooks/useSupabase'
import { onboardingSchema, OnboardingFormValues } from "@/lib/schemas/onboarding"
import { formatAmountInput, parseAmount } from '@/lib/utils'
import { useUserStore } from '@/store/useStore'
import { useUser } from '@clerk/expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'


export default function OnBoardingScreen() {
  const { user} = useUser()
  const { t } = useTranslation()
  const authSupabase = useSupabase()
  const setCurrency = useUserStore((s) => s.setCurrency)
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding)

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors},
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {startingBalance: ""}
  })

  const [selectedCurrency, setSelectedCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === "IDR") ?? ALL_CURRENCIES[0]
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")


  const handleSave = async ({ startingBalance}: OnboardingFormValues) => {
    const parsed = parseAmount(startingBalance)
    setSaving(true)
    setError("")

    const {error: updateError} = await authSupabase
    .from("user")
    .update({
      currency: selectedCurrency.code,
    })
    .eq("clerk_id", user!.id)

    if (updateError) {
      setSaving(false)
      setError(t("addTransaction.saveFailed"))
      return
    }

    const { data: defaultAccount, error: accountFetchError} = await authSupabase
    .from("accounts")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .single()

    if (accountFetchError || !defaultAccount) {
      setSaving(false)
      setError(t("addTransaction.saveFailed"))
      return
    }

    const { error: txError} = await authSupabase.from("transactions").insert({
      user_id: user!.id,
      account_id: defaultAccount.id,
      type: "INCOME",
      amount: parsed,
      category: "other_income",
      description: "Starting balance",
      date: new Date().toISOString(),
      input_method: "MANUAL",
    })

    setSaving(false)

    // Saldo akun diperbarui otomatis oleh trigger database.
    if (txError) {
      setError(t("addTransaction.saveFailed"))
      return
    }

    setCurrency(selectedCurrency.code)
    setNeedsOnboarding(false)
    router.replace("/(root)/(tabs)")
  }

  return (
    <SafeAreaView className='flex-1 bg-page' edges={["top"]}>
        <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        className='flex-1'
        >
          <View className='flex-1 px-6 justify-center -mt-16'>
            <Image
            source={require("../../assets/images/welth.png")}
            className='w-32 h-14 mb-10'
            resizeMode="contain"
            />
            <Text className="text-ink text-3xl font-bold mb-2">
              {t("onboarding.title")}
            </Text>
            <Text className='text-subtle text-sm mb-10'>
             {t("onboarding.subtitle")}
            </Text>

            {/* Starting balance */}
            <Text className='text-ink text-xs font-medium mb-1.5'>
              {t("onboarding.startingBalance")}
            </Text>
            <View className="flex-row items-center bg-card border border-line rounded-xl px-4 mb-1">
                <Text className="text-brand-text-secondary text-sm mr-2">
                  {selectedCurrency.symbol}
              </Text>
              <Controller
              control={control}
              name="startingBalance"
              render={({ field: {value, onChange}}) => (
                <TextInput
                value={value}
                onChangeText={(v) => {
                  setError("")
                  onChange(formatAmountInput(v))
                }}
                  placeholder={t("onboarding.balancePlaceholder")}
                  placeholderTextColor="#8A8D96"
                  keyboardType="numeric"
                  returnKeyType="done"
                  className="flex-1 py-3.5 text-sm text-ink"
                />
              )}
              />
            </View>
            {formErrors.startingBalance && (
              <Text className='text-brand-coral  text-xs mb-4'>
                  {t(formErrors.startingBalance.message ?? "")}
              </Text>
            )}
            <View className='mb-4'/>

            {/* Currency picker */}
            <Text className='text-ink text-xs font-medium mb-1.5'>
              {t("onboarding.currency")}
            </Text>
            <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            className="flex-row items-center justify-between bg-card border border-line rounded-xl px-4 py-3.5 mb-6"
            >
              <Text className='text-sm text-ink'>
              {selectedCurrency.symbol} {selectedCurrency.code} —{" "}
              {selectedCurrency.name}
              </Text>
              <Feather name='chevron-down' size={16} color="#8A8D96" />
            </TouchableOpacity>

            {error ? (
              <Text className='text-brand-coral text-xs mb-4'>{error}</Text>
            ): null}

            <TouchableOpacity
            onPress={handleSubmit(handleSave)}
            disabled={saving}
            className='bg-solid rounded-xl py-4 items-center'
            activeOpacity={0.85}
            >
              <Text className='text-on-solid text-sm font-semibold'>
                {saving ? t("onboarding.saving") : t("onboarding.getStarted")}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <CurrencyPicker
        visible={pickerOpen}
        selectedCode={selectedCurrency.code}
        onSelect={(currency) => {
          setSelectedCurrency(currency)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
        />
    </SafeAreaView>
  )
}