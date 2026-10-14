import { authenticate } from "@/lib/biometric"
import { useUserStore } from "@/store/useStore"
import { Feather } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"
import { useTranslation } from "react-i18next"


export function LockScreen() {
    const { t } = useTranslation()
    const unlock = useUserStore((state) => state.unlock)
    const [busy, setBusy] = useState(false)
    const [failed, setFailed] = useState(false)
    const busyRef = useRef(false)

    const handleUnlock = useCallback(async () => {
        if (busyRef.current) return
        busyRef.current = true
        setBusy(true)
        setFailed(false)
        try {
            const ok = await authenticate(t("lock.unlockPrompt"))
            if (ok) {
                unlock()
            } else {
                setFailed(true)
            }
        } catch {
            setFailed(true)
        } finally {
            busyRef.current = false
            setBusy(false)
        }
    }, [unlock, t])

    useEffect(() => {
        handleUnlock()
    }, [handleUnlock])


    return (
        <View className="absolute inset-0 z-50 flex-1 bg-brand-bg items-center justify-center px-8">
            <Image
                source={require("../assets/images/welth.png")}
                style={{ width: 120, height: 120 }}
                contentFit="contain"
            />

            <Text className="text-brand-text-primary text-lg font-semibold mt-6">
                {t("lock.title")}
            </Text>
            <Text className="text-brand-text-secondary text-sm text-center mt-2">
                {failed ? t("lock.failed") : t("lock.prompt")}
            </Text>


            <TouchableOpacity
                onPress={handleUnlock}
                disabled={busy}
                className="flex-row items-center bg-brand-blue rounded-full px-6 py-3 mt-8"
            >
                {busy ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Feather name="unlock" size={16} color="#fff" />
                )}
                <Text className="text-white text-sm font-medium ml-2">{t("lock.unlock")}</Text>
            </TouchableOpacity>
        </View>
    )
}