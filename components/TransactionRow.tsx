import { getCategoryConfig } from "@/constants/categories";
import { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { memo } from "react";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, TouchableOpacity, View } from "react-native";


const INPUT_METHOD_ICON: Record<
Transaction["input_method"],
keyof typeof Feather.glyphMap
> = {
    MANUAL: "edit-3",
    RECEIPT_SCAN: "camera",
    VOICE: "mic",
}

function TransactionRowComponent({
    tx,
    onDelete,
    onLongPress,
    selectionMode = false,
    selected = false,
    onToggleSelect,
}: {
    tx: Transaction;
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
        {formatPrice(tx.amount)}
      </Text>
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
        renderRightActions={() => (
          <TouchableOpacity
            onPress={() => onDelete(tx)}
            className="bg-brand-coral rounded-2xl ml-2 w-16 items-center justify-center"
          >
            <Feather name="trash-2" size={18} color="#fff" />
          </TouchableOpacity>
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