import { useTranslation } from "react-i18next";

import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQuery";
import {
  createCategoryResolver,
  type CategoryResolver,
} from "@/lib/utils/categories";
import type { CustomCategory } from "@/types/category";

const EMPTY: CustomCategory[] = [];

// Resolver dipakai bersama oleh semua komponen (mis. ratusan TransactionRow):
// di-cache per array data react-query + bahasa, jadi dibangun sekali, bukan per baris.
const cache = new WeakMap<
  CustomCategory[],
  { language: string; resolver: CategoryResolver }
>();

function getResolver(data: CustomCategory[], language: string) {
  const hit = cache.get(data);
  if (hit && hit.language === language) return hit.resolver;
  const resolver = createCategoryResolver(data);
  cache.set(data, { language, resolver });
  return resolver;
}

// Daftar + lookup kategori (bawaan + custom) untuk dipakai di komponen.
// Menggantikan EXPENSE_CATEGORIES / INCOME_CATEGORIES / getCategoryConfig /
// getCategoryLabel di layar yang menampilkan atau memilih kategori.
export function useCategories() {
  const { data, isLoading, isError, error, refetch } = useCategoriesQuery();
  // useTranslation membuat komponen re-render saat bahasa berubah
  const { i18n } = useTranslation();

  const customCategories = data ?? EMPTY;
  const resolver = getResolver(customCategories, i18n.language);

  return { ...resolver, customCategories, isLoading, isError, error, refetch };
}