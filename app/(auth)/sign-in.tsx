import { getAuthErrorMessage, isRateLimitError } from "@/lib/auth-errors"
import { useCooldown } from "@/hooks/useCooldown"
import { codeSchema, SignInFormValues, signInSchema } from "@/lib/schemas/auth"
import { useSignIn } from "@clerk/expo"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import React, { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

type Step = "email" | "code"

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [resent, setResent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { remaining, start: startCooldown } = useCooldown(60)

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
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

  const isLoading = fetchStatus === "fetching"

  const identifierError = errors.fields.identifier
    ? errors.fields.identifier.code === "form_identifier_not_found"
      ? t("auth.accountNotFound")
      : errors.fields.identifier.message
    : null

  const onSendCodePress = async (values: SignInFormValues) => {
    if (remaining > 0 && values.email === email) {
      setSubmitError(t("auth.resendIn", { seconds: remaining }))
      return
    }
    setSubmitError(null)
    const { error: createError } = await signIn.create({ identifier: values.email })
    if (createError) {
      setSubmitError(getAuthErrorMessage(createError, t))
      return
    }

    const { error: sendError } = await signIn.emailCode.sendCode()
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
    const { error } = await signIn.emailCode.verifyCode({ code })
    if (error) {
      setSubmitError(getAuthErrorMessage(error, t))
      return
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return
          const url = decorateUrl("/")
          router.replace(url as any)
        },
      })
    } else {
      console.error("Sign-in attempt not complete:", signIn)
    }
  }

  const onResendPress = async () => {
    if (remaining > 0) return
    setSubmitError(null)
    const { error } = await signIn.emailCode.sendCode()
    if (error) {
      setSubmitError(getAuthErrorMessage(error, t))
      if (isRateLimitError(error)) startCooldown()
      return
    }
    setResent(true)
    startCooldown
  }

  const onStartOverPress = async () => {
    await signIn.reset()
    resetCodeForm({ code: "" })
    setResent(false)
    setSubmitError(null)
    setStep("email")
  }

  if (step === "code") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        className="flex-1 bg-page"
      >
        <View className="flex-1 justify-center px-6 -mt-16">
          <Image
            source={require("../../assets/images/welth.png")}
            className="w-36 h-16 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-ink mb-2 leading-tight">
            {t("auth.verifyTitle")}
          </Text>
          <Text className="text-subtle text-base mb-8">
            {t("auth.signInVerifySubtitle", { email })}
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

          <TouchableOpacity onPress={onResendPress} disabled={isLoading} className="py-2">
            <Text className={remaining > 0 ? "text-subtle text-sm" : "text-brand-blue text-sm"}>
              {remaining > 0 ? t("auth.resendIn", { seconds: remaining }) : t("auth.resendCode")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onStartOverPress} className="py-2">
            <Text className="text-brand-blue text-sm">{t("auth.startOver")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "android" ? "padding" : "height"}
      className="flex-1 bg-page"
    >
      <View className="flex-1 justify-center px-6 -mt-16">
        <Image
          source={require("../../assets/images/welth.png")}
          className="w-36 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-ink mb-2 leading-tight">
          {t("auth.welcomeBack")}
        </Text>
        <Text className="text-subtle text-base mb-2">{t("auth.signInSubtitle")}</Text>

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
        {identifierError && (
          <Text className="text-brand-coral mb-4 text-sm">{identifierError}</Text>
        )}
        {submitError && !identifierError && (
          <Text className="text-brand-coral mb-4 text-sm">{submitError}</Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSendCodePress)}
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
          <Text className="text-subtle">{t("auth.noAccount")} </Text>
          <Link href="/sign-up">
            <Text className="text-brand-blue font-semibold">{t("auth.signUp")}</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}