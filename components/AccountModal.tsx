import { COLORS } from "@/constants/theme";
import { useCreateAccount, useDeleteAccount, useUpdateAccount } from "@/hooks/mutation/useAccountMutations";
import { Account, AccountType } from "@/lib/services/accounts";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheet } from "./BottomSheet";

const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS"]

export function AccountModal({
  visible,
  accounts,
  onClose,
  onSaved,
  onDeleted,
  onMadeDefault,
}: {
  visible: boolean
  accounts: Account | null
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
  onMadeDefault: () => void
}) {
  const { t } = useTranslation()
  const isEditing = !!accounts
  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("CASH")
  const [error, setError] = useState("")

  const { mutateAsync: createAccount, isPending: creating } = useCreateAccount()
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount()
  const { mutateAsync: deleteAccount } = useDeleteAccount()

  const saving = creating || updating

  useEffect(() => {

    if (visible) {
      setName(accounts?.name ?? "")
      setType(accounts?.type ?? "CASH")
      setError("")
    }
  }, [visible, accounts])


  const handleSave = async () => {
    if (!name.trim()) {
      setError('account.nameRequired')
      return
    }
    setError("")
    try {
      if (isEditing) {
        await updateAccount({ accountId: accounts.id, payload: { name: name.trim(), type } })
      } else {
        await createAccount({ name: name.trim(), type })
      }
      onSaved()
    } catch {
      setError("addTransaction.saveFailed")
    }
  }

  const handelDelete = async () => {
    if (!accounts) return
    try {
      const result = await deleteAccount({ accountId: accounts.id })
      if (result.deleted) {
        onDeleted()
        return
      }

      Alert.alert(
        t("account.deleteAccount"),
        result.transactionCount === 1
          ? t("account.deleteMessageOne", { count: result.transactionCount })
          : t("account.deleteMessageMany", { count: result.transactionCount }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("transactions.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAccount({ accountId: accounts.id, force: true })
                onDeleted()
              } catch {
                Alert.alert(t("common.error"), t("account.deleteFailed"))
              }
            },
          },
        ]
      )

    } catch {
      Alert.alert(t("common.error"), t("account.checkFailed"))
    }
  }

  return (
    <BottomSheet
      visible={visible}
      title={isEditing ? t("account.editTitle") : t("profile.addAccount")}
      onClose={onClose}
    >
      <Text className="text-ink text-xs font-medium mb-1.5">{t("account.name")}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t("account.namePlaceholder")}
        placeholderTextColor={COLORS.placeholder}
        className="bg-card border border-line rounded-xl px-4 py-3.5 text-sm text-ink mb-5"
      />

      <Text className="text-ink text-xs font-medium mb-1.5">{t("account.type")}</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {ACCOUNT_TYPES.map((accountType) => (
          <TouchableOpacity
            key={accountType}
            onPress={() => setType(accountType)}
            className={`px-3.5 py-2 rounded-full border ${type === accountType
              ? "bg-solid border-solid"
              : "bg-card border-line"
              }`}
          >
            <Text
              className={`text-xs font-medium ${type === accountType ? "text-on-solid" : "text-ink"
                }`}
            >
              {t(`account.types.${accountType}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Text className="text-brand-coral text-xs mb-3">{t(error)}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-solid rounded-xl py-4 items-center mb-3"
        activeOpacity={0.85}
      >
        <Text className="text-on-solid text-sm font-semibold">
          {saving ? t("common.saving") : isEditing ? t("account.saveChanges") : t("profile.addAccount")}
        </Text>
      </TouchableOpacity>

      {isEditing && !accounts.is_default && (
        <TouchableOpacity onPress={onMadeDefault} className="py-3 items-center">
          <Text className="text-brand-blue text-sm font-medium">
            {t("account.makeDefault")}
          </Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <TouchableOpacity onPress={handelDelete} className="py-3 items-center">
          <Text className="text-brand-coral text-sm font-medium">
            {t("account.deleteAccount")}
          </Text>
        </TouchableOpacity>
      )}
    </BottomSheet>
  )
}