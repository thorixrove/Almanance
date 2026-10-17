import { CategorySheet } from "@/components/CategorySheet";
import { useThemeColors } from "@/components/ThemeProvider";
import { useCategories } from "@/hooks/useCategories";
import type { CategoryInfo } from "@/lib/utils/categories";
import type { CustomCategory, CustomCategoryType } from "@/types/category";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES: CustomCategoryType[] = ["EXPENSE", "INCOME"];

function CategoryRow({
  item,
  onPress,
  isLast,
}: {
  item: CategoryInfo;
  // tanpa onPress = baris hanya-baca (kategori bawaan)
  onPress?: () => void;
  isLast: boolean;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      className={`flex-row items-center bg-card px-4 py-3 ${
        isLast ? "" : "border-b border-line-soft"
      }`}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${item.color}22` }}
      >
        <Text className="text-base">{item.icon}</Text>
      </View>
      <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
        {item.label}
      </Text>
      {onPress && <Feather name="chevron-right" size={16} color={colors.subtle} />}
    </TouchableOpacity>
  );
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { expense, income, customCategories, isLoading, isError, error, refetch } =
    useCategories();

  // Selalu ambil data terbaru setiap layar ini dibuka (staleTime query 30 detik
  // bisa membuat daftar terlihat basi).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [type, setType] = useState<CustomCategoryType>("EXPENSE");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomCategory | null>(null);

  const list = type === "INCOME" ? income : expense;
  // Kategori custom diambil langsung dari data query (bukan dari resolver),
  // supaya layar ini tidak bergantung pada hasil gabungan resolver.
  const custom: CategoryInfo[] = customCategories
    .filter((c) => c.type === type)
    .map((c) => ({
      key: c.key,
      label: c.name,
      englishLabel: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      isCustom: true,
    }));
  const builtIn = list.filter((c) => !c.isCustom);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (key: string) => {
    const found = customCategories.find((c) => c.key === key) ?? null;
    if (!found) return;
    setEditing(found);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-page" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-3 pb-3 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-card border border-line items-center justify-center"
        >
          <Feather name="arrow-left" size={18} color={colors.ink} />
        </TouchableOpacity>
        <Text className="flex-1 text-ink text-lg font-medium">
          {t("customCategory.title")}
        </Text>
        <TouchableOpacity
          onPress={openCreate}
          hitSlop={8}
          className="w-10 h-10 rounded-full bg-solid items-center justify-center"
        >
          <Feather name="plus" size={18} color={colors.card} />
        </TouchableOpacity>
      </View>

      {/* Tipe */}
      <View className="flex-row bg-card rounded-xl border border-line p-1 mx-5 mb-2">
        {TYPES.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setType(opt)}
            className={`flex-1 py-2 rounded-lg items-center ${
              type === opt ? "bg-solid" : ""
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                type === opt ? "text-on-solid" : "text-brand-text-secondary"
              }`}
            >
              {t(`customCategory.${opt === "INCOME" ? "income" : "expense"}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-subtle text-[11px] uppercase tracking-wide mb-2 mt-4 mx-5">
          {t("customCategory.yourCategories")}
        </Text>
        {isLoading ? (
          <View className="py-6 items-center">
            <ActivityIndicator color={colors.icon} />
          </View>
        ) : isError ? (
          // Gagal memuat: tampilkan pesannya (bukan daftar kosong) dan ketuk untuk mencoba lagi
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.7}
            className="mx-5 bg-card rounded-2xl border border-line px-4 py-5 items-center"
          >
            <Feather name="refresh-cw" size={16} color={colors.icon} />
            <Text className="text-brand-coral text-xs text-center mt-2">
              {t("customCategory.loadFailed")}
            </Text>
            <Text className="text-subtle text-[11px] text-center mt-1">
              {(() => {
                const e = error as
                  | { message?: string; code?: string; details?: string; hint?: string }
                  | null
                return [e?.code, e?.message, e?.details, e?.hint]
                  .filter(Boolean)
                  .join(" | ")
              })()}
            </Text>
          </TouchableOpacity>
        ) : custom.length === 0 ? (
          <View className="mx-5 bg-card rounded-2xl border border-line px-4 py-5">
            <Text className="text-subtle text-xs text-center">
              {t("customCategory.empty")}
            </Text>
          </View>
        ) : (
          <View className="mx-5 rounded-2xl overflow-hidden border border-line">
            {custom.map((c, i) => (
              <CategoryRow
                key={c.key}
                item={c}
                isLast={i === custom.length - 1}
                onPress={() => openEdit(c.key)}
              />
            ))}
          </View>
        )}

        <Text className="text-subtle text-[11px] uppercase tracking-wide mb-2 mt-6 mx-5">
          {t("customCategory.builtIn")}
        </Text>
        <View className="mx-5 rounded-2xl overflow-hidden border border-line">
          {builtIn.map((c, i) => (
            <CategoryRow key={c.key} item={c} isLast={i === builtIn.length - 1} />
          ))}
        </View>
      </ScrollView>

      <CategorySheet
        visible={sheetOpen}
        category={editing}
        defaultType={type}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setSheetOpen(false)}
        onDeleted={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}