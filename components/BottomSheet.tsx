import React, { useEffect, useState } from "react"
import {
    Keyboard,
    KeyboardEvent,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native"
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler"
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const OPEN_MS = 320
const CLOSE_MS = 240
// Sheet ditutup kalau digeser lebih dari jarak ini, atau dilempar cukup cepat.
const DISMISS_DISTANCE = 90
const DISMISS_VELOCITY = 700

export function BottomSheet({
    visible,
    title,
    onClose,
    footer,
    scrollable = true,
    children,
}: {
    visible: boolean
    title: string
    onClose: () => void
    footer?: React.ReactNode
    // false = isi mengatur scroll sendiri (mis. FlatList), tanpa ScrollView pembungkus
    scrollable?: boolean
    children: React.ReactNode
}) {
    const { height: screenHeight } = useWindowDimensions()
    const insets = useSafeAreaInsets()

    const [mounted, setMounted] = useState(visible)
    const [keyboardHeight, setKeyboardHeight] = useState(0)

    const translateY = useSharedValue(screenHeight)
    const keyboardOffset = useSharedValue(0)
    const dragStart = useSharedValue(0)

    useEffect(() => {
        if (visible) {
            if (mounted) {
                translateY.value = withTiming(0, {
                    duration: OPEN_MS,
                    easing: Easing.out(Easing.cubic),
                })
            } else {
                // Buang sisa offset keyboard dari sesi sebelumnya.
                keyboardOffset.value = 0
                setKeyboardHeight(0)
                translateY.value = screenHeight
                setMounted(true)
            }
        } else if (mounted) {
            // Tutup keyboard dan reset offset: listener dilepas saat unmount,
            // jadi event "keyboard hide" bisa terlewat dan offset tersangkut.
            Keyboard.dismiss()
            keyboardOffset.value = withTiming(0, {
                duration: CLOSE_MS,
                easing: Easing.in(Easing.cubic),
            })
            setKeyboardHeight(0)
            translateY.value = withTiming(
                screenHeight,
                { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) },
                (finished) => {
                    if (finished) runOnJS(setMounted)(false)
                }
            )
        }
    }, [visible])


    useEffect(() => {
        if (!mounted) return
        const ios = Platform.OS === "ios"
        const showSub = Keyboard.addListener(
            ios ? "keyboardWillShow" : "keyboardDidShow",
            (e: KeyboardEvent) => {
                setKeyboardHeight(e.endCoordinates.height)
                keyboardOffset.value = withTiming(e.endCoordinates.height, {
                    duration: ios ? e.duration || 250 : 220,
                    easing: Easing.out(Easing.cubic),
                })
            }
        )

        const hideSub = Keyboard.addListener(
            ios ? "keyboardWillHide" : "keyboardDidHide",
            (e: KeyboardEvent) => {
                setKeyboardHeight(0)
                keyboardOffset.value = withTiming(0, {
                    duration: ios ? e.duration || 250 : 220,
                    easing: Easing.out(Easing.cubic),
                })
            }
        )
        return () => {
            showSub.remove()
            hideSub.remove()
        }
    }, [mounted, keyboardOffset])

    const handleShow = () => {
        translateY.value = withTiming(0, {
            duration: OPEN_MS,
            easing: Easing.out(Easing.cubic),
        })
    }

    const dismissKeyboard = () => Keyboard.dismiss()

    const pan = Gesture.Pan()
        .onStart(() => {
            dragStart.value = translateY.value
            runOnJS(dismissKeyboard)()
        })


        .onUpdate((e) => {
            translateY.value = Math.max(0, dragStart.value + e.translationY)
        })
        .onEnd((e) => {
            if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
                runOnJS(onClose)()
            } else {
                translateY.value = withTiming(0, {
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                })
            }
        })

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value - keyboardOffset.value }],
    }))

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [0, screenHeight],
            [0.4, 0],
            Extrapolation.CLAMP
        ),
    }))


    const scrollMaxHeight = Math.max(
        140,
        Math.min(screenHeight * 0.6, screenHeight - keyboardHeight - insets.top - 190)
    )

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            statusBarTranslucent
            navigationBarTranslucent
            onShow={handleShow}
            onRequestClose={onClose}
        >
            {/* Di Android, Modal adalah window terpisah, jadi gesture butuh root view sendiri. */}
            <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: "#000" },
                            backdropStyle,
                        ]}
                    />
                </Pressable>

                <Animated.View style={sheetStyle}>
                    <View
                        className="bg-page rounded-t-2xl"
                        style={{
                            paddingBottom: keyboardHeight > 0 ? 16 : insets.bottom + 16,
                        }}
                    >
                        {/* Area geser: handle + judul */}
                        <GestureDetector gesture={pan}>
                            <View collapsable={false} className="px-5 pt-2.5 pb-4">
                                <View className="self-center w-10 h-1 rounded-full bg-line mb-4" />
                                <Text className="text-ink text-base font-semibold">
                                    {title}
                                </Text>
                            </View>
                        </GestureDetector>

                        {scrollable ? (
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                style={{ maxHeight: scrollMaxHeight, flexGrow: 0 }}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            >
                                {children}
                            </ScrollView>
                        ) : (
                            <View style={{ height: scrollMaxHeight, paddingHorizontal: 20 }}>
                                {children}
                            </View>
                        )}

                        {footer ? <View className="px-5 pt-1">{footer}</View> : null}
                    </View>
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    )
}