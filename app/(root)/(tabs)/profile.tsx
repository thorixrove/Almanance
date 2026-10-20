import { TouchableOpacity, Text, Alert, ScrollView, ActivityIndicator, View, Switch } from 'react-native'
import { useAuth, useUser } from '@clerk/expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AccountModal } from "@/components/AccountModal";
import { CurrencyPicker } from '@/components/CurrencyPicker'
import { LanguagePicker } from '@/components/LanguagePicker'
import { ThemePicker } from '@/components/ThemePicker'
import { useThemeColors } from '@/components/ThemeProvider'
import { type ThemeMode } from '@/lib/theme'
import { LANGUAGES, type LanguagePreference } from '@/lib/i18n'
import { useTranslation } from 'react-i18next'
import { useSetDefaultAccount } from '@/hooks/mutation/useAccountMutations'
import { useAccountsQuery } from '@/hooks/queries/useAccountsQuery'
import { useSupabase } from '@/hooks/useSupabase'
import { Account, AccountType } from "@/lib/services/accounts"
import { formatPrice } from '@/lib/utils'
import { useUserStore } from '@/store/useStore'
import { authenticate, getBiometricSupport } from '@/lib/biometric'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from "expo-image-picker"
import { useState } from 'react'


const ACCOUNT_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
  CASH: "dollar-sign",
  BANK: "home",
  CREDIT_CARD: "credit-card",
  SAVINGS: "shield"
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-subtle text-[11px] uppercase tracking-wide mb-2 mt-6 mx-5">
      {children}
    </Text>
  )
}

function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: keyof typeof Feather.glyphMap
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  danger?: boolean
}) {
  const colors = useThemeColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center bg-card px-4 py-3.5 border-b border-line-soft last:border-b-0"
    >
      <View className="w-8 h-8 rounded-full bg-page items-center justify-center mr-3">
        <Feather name={icon} size={15} color={danger ? "#FF6B4A" : colors.icon} />
      </View>
      <Text
        className={`flex-1 text-sm ${danger ? "text-brand-coral" : "text-ink"
          }`}
      >
        {label}
      </Text>
      {value && (
        <Text className="text-brand-text-secondary text-xs mr-2">{value}</Text>
      )}
      {showChevron && onPress && (
        <Feather name="chevron-right" size={16} color={colors.subtle} />
      )}
    </TouchableOpacity>
  )
}


export default function ProfileScreen() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const colors = useThemeColors()
  const supabase = useSupabase()
  const currency = useUserStore((state) => state.currency)
  const setCurrency = useUserStore((state) => state.setCurrency)
  const biometricEnabled = useUserStore((state) => state.biometricEnabled)
  const setBiometricLock = useUserStore((state) => state.setBiometricLock)
  const themeMode = useUserStore((state) => state.themeMode)
  const setThemeMode = useUserStore((state) => state.setThemeMode)
  const languagePreference = useUserStore((state) => state.languagePreference)
  const setLanguage = useUserStore((state) => state.setLanguage)

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = useAccountsQuery()
  const { mutateAsync: setDefaultAccount } = useSetDefaultAccount()



  const handleToggleBiometric = async (next: boolean) => {
    try {
      if (next) {
        const support = await getBiometricSupport()
        if (!support.available) {
          Alert.alert(
            t("profile.biometricUnavailable"),
            support.reason === "no_hardware"
              ? t("profile.biometricNoHardware")
              : t("profile.biometricNotEnrolled")
          )
          return
        }
      }
      // Verifikasi dulu, baik saat mengaktifkan maupun menonaktifkan
      const ok = await authenticate(
        next ? t("profile.biometricConfirmEnable") : t("profile.biometricConfirmDisable")
      )
      if (!ok) return
      await setBiometricLock(next)
    } catch {
      Alert.alert(t("common.failed"), t("profile.biometricFailed"))
    }
  }

  const handlePickAvatar = async () => {
    if (!user) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        t("profile.permissionNeeded"),
        t("profile.permissionMessage")
      )
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })
    if (result.canceled) return
    setUploadingAvatar(true)
    try {
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";
      const dataUrl = `data:${mimeType};base64,${asset.base64}`;
      await user.setProfileImage({ file: dataUrl });
    } catch (error) {
      console.error("Avatar uppload failed:", error)
      Alert.alert(t("common.error"), t("profile.uploadFailed"))
    } finally {
      setUploadingAvatar(false)
    }
  }




  const handleSignOut = () => {
    Alert.alert(t("profile.signOut"), t("profile.signOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };


  const closeModal = () => {
    setModalVisible(false)
    setEditingAccount(null)
  }

  const handleMadeDefault = async () => {
    if (!editingAccount) return
    try {
      await setDefaultAccount(editingAccount.id)
      closeModal()
    } catch {
      Alert.alert(t("common.error"), t("profile.setDefaultFailed"))
    }
  }

  const handleThemeSelect = async (mode: ThemeMode) => {
    setThemePickerOpen(false)
    try {
      await setThemeMode(mode)
    } catch {
      Alert.alert(t("common.error"), t("theme.updateFailed"))
    }
  }

  const handleLanguageSelect = async (code: LanguagePreference) => {
    setLanguagePickerOpen(false)
    try {
      await setLanguage(code)
    } catch {
      Alert.alert(t("common.error"), t("language.updateFailed"))
    }
  }

  const handleCurrencySelect = async (selected: { code: string }) => {
    setCurrencyPickerOpen(false)
    if (!user) return
    try {
      const { error } = await supabase
        .from("user")
        .update({ currency: selected.code })
        .eq("clerk_id", user.id)
      if (error) throw error
      setCurrency(selected.code)
    } catch {
      Alert.alert(t("common.error"), t("profile.currencyFailed"));
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-page' edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-5 pt-3 pb-2">
          <Text className="text-ink text-xl font-semibold">{t("profile.title")}</Text>
        </View>

        {/* user card */}
        <View className='mx-5 mt-2 bg-hero rounded-2xl px-5 py-6 items-center'>
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            className="w-20 h-20 rounded-full bg-[#1A1D26] items-center justify-center overflow-hidden border-2 border-[#2A2E3A]"
          >
            {uploadingAvatar ? (
              <ActivityIndicator color="#8A8D96" />
            ) : user?.imageUrl && user.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <Feather name="user" size={30} color="#8A8D96" />
            )}
            <View className="absolute bottom-0 inset-x-0 h-6 bg-black/50 items-center justify-center">
              <Feather name="camera" size={13} color="#F2EFE9" />
            </View>
          </TouchableOpacity>


          <Text className="text-white text-2xl font-bold mt-3.5">
            {user?.firstName} {user?.lastName}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Feather name="mail" size={11} color="#8A8D96" />
            <Text
              className="text-brand-text-secondary text-xs"
              numberOfLines={1}
            >
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>


        {/* Accounts */}
        <SectionLabel>{t("profile.accounts")}</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-line">
          {loadingAccounts ? (
            <View className="bg-card px-4 py-5 items-center">
              <ActivityIndicator color={colors.icon} />
            </View>
          ) : accountsError ? (
            <View className="bg-card px-4 py-5 items-center">
              <Text className="text-subtle text-xs">
                {t("profile.loadAccountsFailed")}
              </Text>
            </View>
          ) : (
            accounts.map((accounts) => (
              <Row
                key={accounts.id}
                icon={ACCOUNT_ICON[accounts.type]}
                label={accounts.name + (accounts.is_default ? " " + t("profile.defaultSuffix") : "")}
                value={formatPrice(accounts.balance, currency)}
                onPress={() => {
                  setEditingAccount(accounts)
                  setModalVisible(true)
                }}
              />
            ))
          )}
          <Row
            icon='plus'
            label={t("profile.addAccount")}
            onPress={() => {
              setEditingAccount(null)
              setModalVisible(true)
            }}
          />
        </View>

        {/* Preferences */}
        <SectionLabel>{t("profile.preferences")}</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-line">
          <Row
            icon="moon"
            label={t("profile.appearance")}
            value={t(`theme.${themeMode}`)}
            onPress={() => setThemePickerOpen(true)}
          />
          <Row
            icon="globe"
            label={t("profile.language")}
            value={
              languagePreference === "system"
                ? t("language.system")
                : LANGUAGES.find((l) => l.code === languagePreference)?.label
            }
            onPress={() => setLanguagePickerOpen(true)}
          />
          <Row
            icon="dollar-sign"
            label={t("profile.currency")}
            value={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />
          <Row
            icon="tag"
            label={t("profile.manageCategories")}
            onPress={() => router.push("/(root)/categories")}
          />


          <View className="flex-row items-center bg-card px-4 py-3.5">
            <View className="w-8 h-8 rounded-full bg-page items-center justify-center mr-3">
              <Feather name="lock" size={15} color={colors.icon} />
            </View>
            <Text className="flex-1 text-sm text-ink">{t("profile.biometricLock")}</Text>
            <Switch
              value={biometricEnabled === true}
              onValueChange={handleToggleBiometric}
            />
          </View>
        </View>

        {/* Account action */}
        <SectionLabel>{t("profile.accounts")}</SectionLabel>
        <View className="mx-5 rounded-2xl overflow-hidden border border-line">
          <Row
            icon="log-out"
            label={t("profile.signOut")}
            onPress={handleSignOut}
            showChevron={false}
            danger
          />
        </View>
      </ScrollView>

      {user && (
        <AccountModal
          visible={modalVisible}
          accounts={editingAccount}
          onClose={closeModal}
          onSaved={closeModal}
          onDeleted={closeModal}
          onMadeDefault={handleMadeDefault}
        />
      )}

      <ThemePicker
        visible={themePickerOpen}
        selected={themeMode}
        onSelect={handleThemeSelect}
        onClose={() => setThemePickerOpen(false)}
      />

      <LanguagePicker
        visible={languagePickerOpen}
        selected={languagePreference}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguagePickerOpen(false)}
      />

      <CurrencyPicker
        visible={currencyPickerOpen}
        selectedCode={currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyPickerOpen(false)}
      />
    </SafeAreaView>
  )
}