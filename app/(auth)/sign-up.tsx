import { codeSchema, SignUpFormValues, signUpSchema } from "@/lib/schemas/auth"
import { useAuth, useSignUp } from "@clerk/expo"
import { zodResolver} from "@hookform/resolvers/zod"
import { Link, useRouter } from "expo-router"
import { useTranslation } from "react-i18next"
import React, {useEffect, useState} from "react"
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
import { Ionicons } from "@expo/vector-icons"

// Manual keyboard height tracker.
// Needed because KeyboardAvoidingView's automatic resize is unreliable on
// Android when edgeToEdgeEnabled is on \u2014 the OS doesn't shrink the window,
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

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus} = useSignUp()
  const { isSignedIn} = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const keyboardHeight = useKeyboardHeight()
  const [showPassword, setShowPassword] = useState(false)

  const isLoading = fetchStatus === "fetching"

  const [ email, setEmail] = useState("")

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors},
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "", email: "", password: ""},
  })

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: {errors: codeErrors},
  } = useForm<{code: string}>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: {code: ""},
  })

  const onSignUpPress = async (values: SignUpFormValues) => {
    setEmail(values.email)

    const {error} = await signUp.password({
      emailAddress: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
    })

    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }
    if(!error) await signUp.verifications.sendEmailCode()
  }

  const onVerifyPress = async ({ code}: {code: string}) => {
    await signUp.verifications.verifyEmailCode({ code})

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl}) => {
          if (session?.currentTask) return
          const url = decorateUrl("/")
          router.replace(url as any)
        },
      })
    } else {
      console.error("Sign-up attempt not complete", signUp)
    }
  }

  if (signUp.status === "complete" || isSignedIn) {
    return null
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : undefined}
        className="flex-1 bg-page"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: keyboardHeight > 0 ? "flex-start" : "center",
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0,
            }}
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
              render={({ field: {value, onChange}}) => {
                return  (
                  <TextInput
                    className="border border-line bg-card rounded-xl px-4 py-3 mb-2 text-ink"
                    placeholder={t("auth.codePlaceholder")}
                    placeholderTextColor="#8A8D96"
                    value={value}
                    onChangeText={onChange}
                  />
                )
              }}
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

            <TouchableOpacity
              onPress={handleCodeSubmit(onVerifyPress)}
              disabled={isLoading}
              className="w-full  bg-brand-blue py-4 rounded-xl items-center mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">{t("auth.verify")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => signUp.verifications.sendEmailCode()}
              className="py-2"
            >
              <Text className="text-brand-blue text-sm">{t("auth.resendCode")}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => signUp.reset()} className="py-2">
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
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: keyboardHeight > 0 ? "flex-start" : "center",
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0,
          }}
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
          <Text className="text-subtle text-base mb-8">
            {t("auth.createSubtitle")}
          </Text>

          <View className="flex-row gap-3 mb-2">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { value, onChange } }) => {
                return (
                  <TextInput
                    className="flex-1 border border-line bg-card rounded-xl px-4 py-3 text-ink"
                    placeholder={t("auth.firstName")}
                    placeholderTextColor="#8A8D96"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                );
              }}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field: { value, onChange } }) => {
                return (
                  <TextInput
                    className="flex-1 border border-line bg-card rounded-xl px-4 py-3 text-ink"
                    placeholder={t("auth.lastName")}
                    placeholderTextColor="#8A8D96"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                );
              }}
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
            render={({ field: { value, onChange } }) => {
              return (
                <TextInput
                  className="border border-line bg-card rounded-xl px-4 py-3 mb-2 text-ink"
                  placeholder={t("auth.email")}
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                />
              );
            }}
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

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => {
                return (
                  <View className="relative justify-center mb-2">
                    <TextInput
                      className="border border-line bg-card rounded-xl px-4 py-3 pr-12 text-ink"
                      placeholder={t("auth.password")}
                      placeholderTextColor="#8A8D96"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#8A8D96"
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />

          
          {formErrors.password && (
            <Text className="text-brand-coral mb-4 text-sm">
              {t(formErrors.password.message ?? "")}
            </Text>
          )}
          {errors.fields.password && (
            <Text className="text-brand-coral mb-4 text-sm">
              {errors.fields.password.message}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit(onSignUpPress)}
            disabled={isLoading}
            className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">{t("auth.signUp")}</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-subtle">
              {t("auth.haveAccount")}{" "}
            </Text>
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