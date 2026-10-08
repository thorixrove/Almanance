import { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function FormSheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="bg-brand-body rounded-t-2xl px-5 pt-5 pb-8"
          style={{ marginBottom: keyboardHeight }}
        >
          <Text className="text-brand-bg text-base font-semibold mb-4">
            {title}
          </Text>

          {children}

          <TouchableOpacity onPress={onClose} className="-mt-1 py-8 items-center">
            <Text className="text-brand-text-secondary text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}