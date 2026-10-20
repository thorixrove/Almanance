export type CategoryBudget = {
  id: string;
  user_id: string;
  // key kategori: bawaan ("food") atau custom ("c_xxxxxxxxxxxx")
  category: string;
  amount: number;
  last_alert_sent: string | null;
  last_alert_threshold: number | null;
  created_at: string;
  updated_at: string;
};

export type NewCategoryBudget = {
  category: string;
  amount: number;
};