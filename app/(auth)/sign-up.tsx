import { getAuthErrorMessage, isRateLimitError } from "@/lib/auth-errors"
import { useCooldown } from "@/hooks/useCooldown"
import { codeSchema, SignUpFormValues, signUpSchema } from "@/lib/schemas/auth"
import { useAuth, useSignUp } from "@clerk/expo"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import React, { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"

// Manual keyboard height tracker.
// Needed because KeyboardAvoidingView's automatic resize is unreliable on
// Android when edgeToEdgeEnabled is on: the OS doesn't shrink the window,
// so we add the missing scroll room ourselves.
function useKeyboardHeight() {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow"
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide"
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])
  return height
}

type Step = "form" | "code"

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const keyboardHeight = useKeyboardHeight()

  const [step, setStep] = useState<Step>("form")
  const [email, setEmail] = useState("")
  const [resent, setResent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { remaining, start: startCooldown } = useCooldown(60)

  const isLoading = fetchStatus === "fetching"

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "", email: "" },
  })

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    reset: resetCodeForm,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: { code: "" },
  })

  const onSignUpPress = async (values: SignUpFormValues) => {
    if (remaining > 0 && values.email === email) {
      setSubmitError(t("auth.resendIn", { seconds: remaining }))
      return
    }
    setSubmitError(null)
    const { error } = await signUp.create({
      emailAddress: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
    })
    if (error) {
      setSubmitError(getAuthErrorMessage(error, t))
      return
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode()
    if (sendError) {
      setSubmitError(getAuthErrorMessage(sendError, t))
      return
    }

    setEmail(values.email)
    setResent(false)
    startCooldown()
    setStep("code")
  }


  const onVerifyPress = async ({ code }: { code: string }) => {
    setSubmitError(null)
    const { error } = await signUp.verifications.verifyEmailCode({ code })
    if (error) {
      setSubmitError(getAuthErrorMessage(error, t))
      return
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return
          const url = decorateUrl("/")
          router.replace(url as any)
        },
      })
    } else {
      console.error("Sign-up attempt not complete", signUp)
    }
  }

  const onResendPress = async () => {
    if (remaining > 0) return
    setSubmitError(null)
    const { error } = await signUp.verifications.sendEmailCode()
    if (error) {
      setSubmitError(getAuthErrorMessage(error, t))
      if (isRateLimitError(error)) startCooldown()
      return
    }
    setResent(true)
    startCooldown()
  }

  const onStartOverPress = async () => {
    await signUp.reset()
    resetCodeForm({ code: "" })
    setResent(false)
    setSubmitError(null)
    setStep("form")
  }

  if (signUp.status === "complete" || isSignedIn) {
    return null
  }

  const contentStyle = {
    flexGrow: 1,
    justifyContent: keyboardHeight > 0 ? ("flex-start" as const) : ("center" as const),
    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0,
  }

  if (step === "code") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : undefined}
        className="flex-1 bg-page"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={contentStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className="px-6 -mt-16"
          >
            <Image
              source={require("../../assets/images/welth.png")}
              className="w-36 h-16 mb-8"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-ink mb-2 leading-tight">
              {t("auth.verifyTitle")}
            </Text>
            <Text className="text-subtle text-base mb-8">
              {t("auth.sentCode", { email })}
            </Text>

            <Controller
              control={codeControl}
              name="code"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  className="border border-line bg-card rounded-xl px-4 py-3 mb-2 text-ink tracking-widest"
                  placeholder={t("auth.codePlaceholder")}
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  autoFocus
                />
              )}
            />
            {codeErrors.code && (
              <Text className="text-brand-coral mb-4 text-sm">
                {t(codeErrors.code.message ?? "")}
              </Text>
            )}
            {errors.fields.code && (
              <Text className="text-brand-coral mb-4 text-sm">
                {errors.fields.code.message}
              </Text>
            )}
            {resent && (
              <Text className="text-subtle mb-4 text-sm">{t("auth.codeResent")}</Text>
            )}
            {submitError && (
              <Text className="text-brand-coral mb-4 text-sm">{submitError}</Text>
            )}

            <TouchableOpacity
              onPress={handleCodeSubmit(onVerifyPress)}
              disabled={isLoading}
              className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">{t("auth.verify")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onResendPress} disabled={isLoading || remaining > 0} className="py-2">
              <Text className={remaining > 0 ? "text-subtle text-sm" : "text-brand-blue text-sm"}>
                {remaining > 0 ? t("auth.resendIn", { seconds: remaining }) : t("auth.resendCode")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onStartOverPress} className="py-2">
              <Text className="text-brand-blue text-sm">{t("auth.startOver")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "padding" : undefined}
      className="flex-1 bg-page"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6 -mt-16"
        >
          <Image
            source={require("../../assets/images/welth.png")}
            className="w-36 h-16 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-ink mb-2 leading-tight">
            {t("auth.createAccount")}
          </Text>
          <Text className="text-subtle text-base mb-2">{t("auth.createSubtitle")}</Text>

          <View className="flex-row gap-3 mb-2">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  className="flex-1 border border-line bg-card rounded-xl px-4 py-3 text-ink"
                  placeholder={t("auth.firstName")}
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  textContentType="givenName"
                />
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  className="flex-1 border border-line bg-card rounded-xl px-4 py-3 text-ink"
                  placeholder={t("auth.lastName")}
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  textContentType="familyName"
                />
              )}
            />
          </View>
          {(formErrors.firstName || formErrors.lastName) && (
            <Text className="text-brand-coral mb-4 text-sm">
              {t(formErrors.firstName?.message || formErrors.lastName?.message || "")}
            </Text>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="border border-line bg-card rounded-xl px-4 py-3 mb-2 text-ink"
                placeholder={t("auth.email")}
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            )}
          />
          {formErrors.email && (
            <Text className="text-brand-coral mb-4 text-sm">
              {t(formErrors.email.message ?? "")}
            </Text>
          )}
          {errors.fields.emailAddress && (
            <Text className="text-brand-coral mb-4 text-sm">
              {errors.fields.emailAddress.message}
            </Text>
          )}
          {submitError && !errors.fields.emailAddress && (
            <Text className="text-brand-coral mb-4 text-sm">{submitError}</Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit(onSignUpPress)}
            disabled={isLoading}
            className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">{t("auth.sendCode")}</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-subtle">{t("auth.haveAccount")} </Text>
            <Link href="/sign-in">
              <Text className="text-brand-blue font-semibold">{t("auth.signIn")}</Text>
            </Link>
          </View>

          {/* Required by Clerk for bot protection */}
          <View nativeID="clerk-captcha" />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}