export type CustomCategoryType = "EXPENSE" | "INCOME";

export type CustomCategory = {
  id: string;
  user_id: string;
  // disimpan di transactions.category, bentuknya "c_xxxxxxxxxxxx"
  key: string;
  name: string;
  icon: string;
  color: string;
  type: CustomCategoryType;
  created_at: string;
};

export type NewCustomCategory = {
  name: string;
  icon: string;
  color: string;
  type: CustomCategoryType;
};

// key dan type tidak bisa diubah setelah kategori dibuat
export type UpdateCustomCategory = {
  name: string;
  icon: string;
  color: string;
};