export type User = {
  id: string;
  name: string | null;
  email: string | null;
  image_url: string | null;
};

export type Set = {
  id: string;
  visibility: string;
  title: string;
  created_at: string; // ISO
  updated_at: string; // ISO
  user_id: string;
};

export type Exam = {
  id: string;
  set_id: string;
  user_id: string;
  visibility: string;
  title: string;
  start_time: string; // ISO
  description: string;
  duration: number;
  end_time: string; // ISO
  created_at: string; // ISO
  updated_at: string; // ISO
  created_by: User;
  set?: Set | null;
  // Optional UI-extended fields if backend provides them
  attempted?: boolean;
  result_available?: boolean;
  passed_without_attempt?: boolean;
};

export type ExamAction =
  | { label: "Open"; to: string }
  | { label: "See result"; to: string }
  | null;
