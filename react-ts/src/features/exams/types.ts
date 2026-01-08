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

export function isUpcoming(exam: Exam, now = new Date()): boolean {
  return new Date(exam.start_time).getTime() > now.getTime();
}

export function isRunning(exam: Exam, now = new Date()): boolean {
  const start = new Date(exam.start_time).getTime();
  const end = new Date(exam.end_time).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

export function isEnded(exam: Exam, now = new Date()): boolean {
  return new Date(exam.end_time).getTime() < now.getTime();
}

export type ExamAction =
  | { label: "Open"; to: string }
  | { label: "See result"; to: string }
  | null;

export function getExamAction(exam: Exam): ExamAction {
  if (exam.passed_without_attempt) return null;
  if (exam.attempted)
    return { label: "See result", to: `/submissions/${exam.id}` };
  if (isRunning(exam) || isUpcoming(exam))
    return { label: "Open", to: `/exam/${exam.id}` };
  return null;
}
