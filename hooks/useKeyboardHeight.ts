import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardHeight() {
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