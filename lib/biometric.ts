import * as LocalAuthentication from "expo-local-authentication"
import * as SecureStore from "expo-secure-store"
 
const ENABLED_KEY = "biometric_lock_enabled"
 
export type BiometricSupport =
  | { available: true }
  | { available: false; reason: "no_hardware" | "not_enrolled" }

export async function getBiometricSupport(): Promise<BiometricSupport>{
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    if (!hasHardware) return {available: false, reason: "no_hardware"}

    const isEnrolled =  await LocalAuthentication.isEnrolledAsync()
    if (!isEnrolled) return {available: false, reason: "not_enrolled"}
    return {available: true}
}

export async function authenticate(
    promptMessage = "Buka Almanance"
) : Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Batal",
        disableDeviceFallback: false,
    })
    return result.success
}

export async function getBiometricEnabled(): Promise<boolean> {
    try {
        return (await SecureStore.getItemAsync(ENABLED_KEY)) === "1"
    } catch (error) {
        return false
    }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
        await SecureStore.setItemAsync(ENABLED_KEY, "1")
    } else {
        await SecureStore.deleteItemAsync(ENABLED_KEY)
    }
}