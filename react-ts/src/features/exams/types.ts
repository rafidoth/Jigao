type Exam = {
  examId: string;
  title: string;
  description: string;
  durationMinutes: number;
  visibility: "public" | "private" | "restricted";
  startTime: Date;
  duration: number;
  createdAt: Date;
  questionCount: number;
};
