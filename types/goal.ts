export type Goal = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  saved_amount: number;
  // "YYYY-MM-DD" atau null kalau tanpa tenggat
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewGoal = {
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  deadline: string | null;
};

export type UpdateGoal = NewGoal;