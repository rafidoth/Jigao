export type ExamDetails = {
  id: string;
  title: string;
  description: string;
  visibility: string;
  start_time: string;
  end_time: string;
  duration: number;
  session_status: string;
};

export type ExamStatus = "waiting" | "running" | "ended" | "";
export type ExamVisibility = "private" | "restricted" | "public";
