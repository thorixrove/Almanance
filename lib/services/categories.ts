import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CustomCategory,
  NewCustomCategory,
  UpdateCustomCategory,
} from "@/types/category";

export type {
  CustomCategory,
  NewCustomCategory,
  UpdateCustomCategory,
} from "@/types/category";

// RLS (policy custom_categories_own) sudah membatasi hasil ke baris milik pengguna
// yang sedang login, jadi tidak perlu filter user_id di sini. `userId` dipertahankan
// di parameter agar pemanggil tidak berubah.
export async function getCustomCategories(
  supabase: SupabaseClient,
  _userId: string
) {
  const { data, error } = await supabase
    .from("custom_categories")
    .select("id, user_id, key, name, icon, color, type, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as CustomCategory[];
}

export async function createCustomCategory(
  supabase: SupabaseClient,
  userId: string,
  payload: NewCustomCategory
) {
  const { data, error } = await supabase
    .from("custom_categories")
    .insert({
      user_id: userId,
      name: payload.name.trim(),
      icon: payload.icon,
      color: payload.color,
      type: payload.type,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CustomCategory;
}

export async function updateCustomCategory(
  supabase: SupabaseClient,
  id: string,
  payload: UpdateCustomCategory
) {
  const { data, error } = await supabase
    .from("custom_categories")
    .update({
      name: payload.name.trim(),
      icon: payload.icon,
      color: payload.color,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CustomCategory;
}

// Transaksi yang memakai kategori ini dipindah ke "other" / "other_income"
// oleh RPC. Mengembalikan jumlah transaksi yang dipindah.
export async function deleteCustomCategory(
  supabase: SupabaseClient,
  id: string
) {
  const { data, error } = await supabase.rpc("delete_custom_category", {
    p_id: id,
  });

  if (error) throw error;
  return (data ?? 0) as number;
}

// Jumlah transaksi yang memakai kategori ini (untuk konfirmasi sebelum hapus).
export async function getCategoryUsageCount(
  supabase: SupabaseClient,
  key: string
) {
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category", key);

  if (error) throw error;
  return count ?? 0;
}

// Nama kembar (unique index custom_categories_user_type_name_uidx)
export function isDuplicateCategoryError(error: unknown) {
  return (error as { code?: string } | null)?.code === "23505";
}

// Batas 50 kategori (trigger custom_categories_guard)
export function isCategoryLimitError(error: unknown) {
  const message = (error as { message?: string } | null)?.message ?? "";
  return message.includes("Maksimal 50 kategori");
}