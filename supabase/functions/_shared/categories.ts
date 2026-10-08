// Lightweight copy of constants/categories.ts, scoped to this function.
// Only the label is actually used by the weekly-tips email.
// Keep in sync with constants/categories.ts if categories change.

export const CATEGORIES = {
  food: { label: "Food & Dining" },
  groceries: { label: "Groceries" },
  transport: { label: "Transport" },
  shopping: { label: "Shopping" },
  entertainment: { label: "Entertainment" },
  health: { label: "Health" },
  utilities: { label: "Utilities" },
  rent: { label: "Rent" },
  education: { label: "Education" },
  travel: { label: "Travel" },
  insurance: { label: "Insurance" },
  subscriptions: { label: "Subscriptions" },
  emi: { label: "EMI / Loan" },
  personal_care: { label: "Personal Care" },
  other: { label: "Other" },
  salary: { label: "Salary" },
  freelance: { label: "Freelance" },
  business: { label: "Business" },
  investment: { label: "Investment" },
  gift: { label: "Gift" },
  other_income: { label: "Other Income" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const getCategoryConfig = (key: CategoryKey) => CATEGORIES[key];