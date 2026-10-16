import { useTranslation } from "react-i18next";

import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQuery";
import {
    createCategoryResolver,
    type CategoryResolver,
} from "@/lib/utils/categories";
import type { CustomCategory } from "@/types/category";

const EMPTY: CustomCategory[] = [];


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

export function useCategories() {
    const { data, isLoading } = useCategoriesQuery();
    // useTranslation membuat komponen re-render saat bahasa berubah
    const { i18n } = useTranslation();

    const customCategories = data ?? EMPTY;
    const resolver = getResolver(customCategories, i18n.language);

    return { ...resolver, customCategories, isLoading };
}