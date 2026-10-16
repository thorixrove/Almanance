import {
    CATEGORIES,
    getCategoryLabel,
    isBuiltInCategory,
    type CategoryKey,
} from "@/constants/categories";
import type { CustomCategory } from "@/types/category";


export type CategoryInfo = {
    key: CategoryKey
    label: string
    englishLabel: string
    icon: string
    color: string
    type: "EXPENSE" | "INCOME" | "TRANSFER";
    isCustom: boolean;
}

export type CategoryResolver = {
    expense: CategoryInfo[]
    income: CategoryInfo[]
    getCategory: (
        key: CategoryKey,
        fallbackType?: "EXPENSE" | "INCOME"
    ) => CategoryInfo
    getLabel: (key: CategoryKey) => string
}

function builtInInfo(key: keyof typeof CATEGORIES): CategoryInfo {
    const c = CATEGORIES[key]
    return {
        key,
        label: getCategoryLabel(key),
        englishLabel: c.label,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isCustom: false,
    }
}

function customInfo(c: CustomCategory): CategoryInfo {
    return {
        key: c.key,
        label: c.name,
        englishLabel: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isCustom: true,
    }
}

export function createCategoryResolver(
    custom: CustomCategory[] = []
): CategoryResolver {
    const builtIn = Object.keys(CATEGORIES)
        .filter((k) => CATEGORIES[k as keyof typeof CATEGORIES].type !== "TRANSFER")
        .map((k) => builtInInfo(k as keyof typeof CATEGORIES))

    const customInfos = custom.map(customInfo)
    const customByKey = new Map(customInfos.map((c) => [c.key as string, c]))

    const expense = [
        ...builtIn.filter((c) => c.type === "EXPENSE"),
        ...customInfos.filter((c) => c.type === "INCOME"),
    ]
    const income = [
        ...builtIn.filter((c) => c.type === "INCOME"),
        ...customInfos.filter((c) => c.type === "INCOME"),
    ]

    const getCategory = (
        key: CategoryKey,
        fallbackType: "EXPENSE" | "INCOME" = "EXPENSE"
    ): CategoryInfo => {
        if (isBuiltInCategory(key)) return builtInInfo(key)
        const found = customByKey.get(key)
        if (found) return found
        return builtInInfo(fallbackType === "INCOME" ? "other_income" : "other");
    }

    return {
        expense,
        income,
        getCategory,
        getLabel: (key) => getCategory(key).label,
    }
}