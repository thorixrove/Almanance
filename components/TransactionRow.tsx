import { getCategoryConfig } from "@/constants/categories";
import { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { memo } from "react";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useUserStore } from "@/store/useStore";


const INPUT_METHOD_ICON: Record<
Transaction["input_method"],
keyof typeof Feather.glyphMap
> = {
    MANUAL: "edit-3",
    RECEIPT_SCAN: "camera",
    VOICE: "mic",
}

// Tombol aksi yang muncul saat baris digeser. Muncul bertahap (fade + membesar)
// mengikuti progress geseran, jadi terasa halus, bukan tiba-tiba terlihat.
function SwipeActions({
    progress,
    onEdit,
    onDelete,
}: {
    progress: SharedValue<number>
    onEdit?: () => void
    onDelete: () => void
}) {
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.7, 1], Extrapolation.CLAMP),
        transform: [
            { scale: interpolate(progress.value, [0, 1], [0.85, 1], Extrapolation.CLAMP) },
        ],
    }))

    return (
        <Animated.View style={[{ flexDirection: "row" }, style]}>
            {onEdit && (
                <TouchableOpacity
                    onPress={onEdit}
                    className="bg-brand-blue rounded-2xl ml-2 w-16 items-center justify-center"
                >
                    <Feather name="edit-2" size={18} color="#fff" />
                </TouchableOpacity>
            )}
            <TouchableOpacity
                onPress={onDelete}
                className="bg-brand-coral rounded-2xl ml-2 w-16 items-center justify-center"
            >
                <Feather name="trash-2" size={18} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    )
}

function TransactionRowComponent({
    tx,
    onDelete,
    onLongPress,
    selectionMode = false,
    selected = false,
    onToggleSelect,
    onEdit,
}: {
    tx: Transaction;
    // Dipanggil dari tombol Edit yang muncul saat baris digeser ke kiri.
    onEdit?: (tx: Transaction) => void
    // now receives the transaction, so the parent can pass a single
    // stable function reference instead of creating a new closure
    // per row on every render.
    onDelete?: (tx: Transaction) => void
    // Long-pressing a row enters selection mode and selects it.
    onLongPress?: (tx: Transaction) => void
    // When true, tapping the row toggles selection instead of the normal
    // swipe-to-delete behavior.
    selectionMode?: boolean
    selected?: boolean
    onToggleSelect?: (tx: Transaction) => void
}) {
    const config = getCategoryConfig(tx.category)
    const isIncome = tx.type === "INCOME"
    const currency = useUserStore((state) => state.currency)

    const row = (
    <View
      className="flex-row items-center bg-white rounded-2xl border border-[#E8E6DF] pl-3 pr-3.5 py-4"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: config.color,
        borderColor: selected ? "#4A9EFF" : "#E8E6DF",
        borderWidth: selected ? 1.5 : undefined,
      }}
    >
      {selectionMode && (
        <View
          className="w-5 h-5 rounded-full items-center justify-center mr-2.5"
          style={{
            backgroundColor: selected ? "#4A9EFF" : "transparent",
            borderWidth: selected ? 0 : 1.5,
            borderColor: "#C7C9D1",
          }}
        >
          {selected && <Feather name="check" size={13} color="#fff" />}
        </View>
      )}

      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${config.color}22` }}
      >
        <Text className="text-lg">{config.icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-brand-bg text-sm font-medium" numberOfLines={1}>
          {tx.description || config.label}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Feather
            name={INPUT_METHOD_ICON[tx.input_method]}
            size={11}
            color="#8A8D96"
          />
          <View
            className="px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.color}1A` }}
          >
            <Text className="text-[10px] font-medium" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
          {tx.is_flagged && (
            <View className="flex-row items-center gap-1 ml-1">
              <Feather name="alert-triangle" size={11} color="#FF6B4A" />
              <Text className="text-brand-coral text-[11px]">Flagged</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        className={`text-sm font-medium ${
          isIncome ? "text-brand-success" : "text-brand-coral"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatPrice(tx.amount, currency)}
      </Text>

      {/* Petunjuk visual: baris ini bisa digeser ke kiri */}
      {(onEdit || onDelete) && (
        <Feather
          name="chevron-left"
          size={14}
          color="#C7C9D1"
          style={{ marginLeft: 6 }}
        />
      )}
    </View>
    )

    // Selection mode: whole row is tappable to toggle, long-press and
    // swipe are disabled so selection doesn't fight with those gestures.
    if (selectionMode) {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onToggleSelect?.(tx)}
                className="mb-2.5"
            >
                {row}
            </TouchableOpacity>
        )
    }

    if (!onDelete) {
        return (
            <TouchableOpacity
                activeOpacity={onLongPress ? 0.7 : 1}
                onLongPress={() => onLongPress?.(tx)}
                delayLongPress={350}
                className="mb-2.5"
            >
                {row}
            </TouchableOpacity>
        )
    }

    return (
      <View className="mb-2.5">
      <Swipeable
        overshootRight={false}
        rightThreshold={36}
        animationOptions={{ damping: 22, stiffness: 240 }}
        renderRightActions={(progress, _translation, swipeable) => (
          <SwipeActions
            progress={progress}
            onEdit={
              onEdit
                ? () => {
                    swipeable.close()
                    onEdit(tx)
                  }
                : undefined
            }
            onDelete={() => {
              swipeable.close()
              onDelete(tx)
            }}
          />
        )}
      >
        <TouchableOpacity
            activeOpacity={onLongPress ? 0.7 : 1}
            onLongPress={() => onLongPress?.(tx)}
            delayLongPress={350}
        >
            {row}
        </TouchableOpacity>
      </Swipeable>
    </View>
    )
}

// React.memo: skip re-rendering this row if props didn't actually change
// reference. Combined with stable callbacks from the parent (see
// transactions.tsx), unrelated re-renders of the screen (search typing,
// filter toggles, etc.) no longer re-render every row.
export const TransactionRow = memo(TransactionRowComponent)